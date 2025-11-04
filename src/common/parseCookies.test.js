/**
 * Cookie解析测试文件
 * 演示如何将'_WorkbenchCross_=Ultraman; loginLocale=zh_CN; jDiowrkTokenMock=; XSRF-TOKEN=AX_MO9D22N3NCXJBYNRI0NKY4V6S!201553; UBA_LAST_EID=0oxz04kkag2f'拆解为对象
 */

import { parseCookies } from './parseCookies';

// 待解析的cookie字符串
const cookieString = '_WorkbenchCross_=Ultraman; loginLocale=zh_CN; jDiowrkTokenMock=; XSRF-TOKEN=AX_MO9D22N3NCXJBYNRI0NKY4V6S!201553; UBA_LAST_EID=0oxz04kkag2f';

// 解析cookie字符串为对象
const cookieObject = parseCookies(cookieString);

// 输出结果
console.log('原始cookie字符串:', cookieString);
console.log('解析后的cookie对象:', cookieObject);

// 访问单个cookie值
console.log('WorkbenchCross值:', cookieObject['_WorkbenchCross_']);
console.log('loginLocale值:', cookieObject['loginLocale']);
console.log('jDiowrkTokenMock值:', cookieObject['jDiowrkTokenMock']);
console.log('XSRF-TOKEN值:', cookieObject['XSRF-TOKEN']);
console.log('UBA_LAST_EID值:', cookieObject['UBA_LAST_EID']);

export default cookieObject;