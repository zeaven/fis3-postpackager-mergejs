

const fs = require('fs');

const path = require('path');

let config;

/**
 * 打包阶段插件接口
 * @param  {Object} ret      一个包含处理后源码的结构
 * @param  {Object} conf     一般不需要关心，自动打包配置文件
 * @param  {Object} settings 插件配置属性
 * @param  {Object} opt      命令行参数
 */
module.exports = function (ret, conf, settings, opt) {
	// ret.src 所有的源码，结构是 {'<subpath>': <File 对象>}
    // ret.ids 所有源码列表，结构是 {'<id>': <File 对象>}
    // ret.map 如果是 spriter、postpackager 这时候已经能得到打包结果了，
    //         可以修改静态资源列表或者其他
	let root = fis.project.getProjectPath();

	let filePath = path.join(root, '/components/pages/test.hbs');
	config = fis.util.merge({path: 'components'}, settings || {});
	config.dest = opt.dest;
	fis.util.map(ret.src, function (path, file) {
		if (file.ext !== config.ext) return;

		let content = fis.util.readBuffer(file._content);
		let requires = findRequires(content);
		if (requires.length === 0) return;
		//生成allinone文件
		let allContent = mergeContent(ret, file, requires);
		createAllInOne(ret, file, allContent);

		insertAllInOne(content, file);
	});

};

function findRequires(content) {
	re = /@require\(['"]?([^\)'"]*)['"]?\)/gi;
	let result = [];
	let match;

	while (match = re.exec(content)) {
		result.push(match[1]);
	}

	return result;
}
function createAllInOne(ret, file, allContent) {
	let root = path.join(fis.project.getProjectPath(), config.dest);

	let fileName = file.filename + '.bundle.js';
	let oneFile = fis.file(fis.project.getProjectPath(), file.subdirname.substring(1) + '/' + fileName);
	oneFile.setContent(allContent);
	fis.compile.process(oneFile);
	let onePath = path.join(root, oneFile.release);
	fis.util.write(onePath, oneFile.getContent(), 'utf8');
}

function mergeContent(ret, file, requires) {
	let content = '/**\n * merge by fis3-postpackager-mergejs\n * author:zeaven\n */\n';
	let lines = [];
	fis.util.map(requires, function (i, filePath) {
		let text = '';
		if (config.debug) {
			text += '\n/**\n * import from '+ filePath + '\n */';
		}
		let requireFile = getRequireFile(ret.src, filePath, file);
		if (!requireFile) {
			throw new Error('file not found[' + filePath + ']');
		}
		text += '\n' + requireFile.getContent();
		lines.push(text);
	});
	content = lines.join((new Array(10).fill('\n')).join(''));
	return content;
}

function insertAllInOne(content, file) {
	let folder = file.subdirname.replace('components', 'js') + '/';
	let onePath = folder + file.filename + '.bundle.js';
	content = content.replace(/<! *--REQUIRE_PLACEHOLDER *-->/g, '<script src="{{v \'' + onePath + '\'}}"></script>');
	content = content.replace(/<! *--REQUIRE_PATH *-->/g, onePath);
	content = content.replace(/\<!\-\-\s*\@[^\>]*\-\-\>/gi, '');
	file.setContent(content);
}
/**
 * 查找引用js
 * @param  {object} src     文件map
 * @param  {string} key     引用路径
 * @param  {File} reqFile 引用文件
 * @return {[type]}         [description]
 */
function getRequireFile(src, path, reqFile) {
	if (path[0] === '/') {
		//根目录
		return src[path];
	} else if (path[0] === '.') {
		path = config.path + path.substring(1);
		return src[path];
	}else {
		//当前目录
		path = reqFile.subpath.replace(reqFile.basename, path);
		return src[path];
	}
}
