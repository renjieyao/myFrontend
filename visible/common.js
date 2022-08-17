/*
 * @Description: 
 * @Date: 2022-05-02 17:09:52
 * @LastEditTime: 2022-05-02 17:25:16
 * @LastEditors: Please set LastEditors
 * @Reference: 
 */
export function createCircleVertex(x, y, r, n, isStar = false){
    const {sin,cos} = Math;
    const perAngel = isStar ? (Math.PI / n) : ((2 * Math.PI) / n);
    const positionArr = [];
    for(let i = 0;i < n;i++){
        const angel = i * perAngel;
        const nx = x + r * cos(angel);
        const ny = y + r * sin(angel);
        positionArr.push(nx, ny);
    }
    return new Float32Array(positionArr);
}
export function create2CircleVertex(x, y, r, R, n) {
    const sin = Math.sin;
    const cos = Math.cos;
    const perAngel = Math.PI / n;
    const positionArray = [];
    for (let i = 0; i < 2 * n; i++) {
        const angel = i * perAngel;
        if (i % 2 !== 0) {
            const Rx = x + R * cos(angel);
            const Ry = y + R * sin(angel);
            positionArray.push(Rx, Ry);
        } else {
            const rx = x + r * cos(angel);
            const ry = y + r * sin(angel);
            positionArray.push(rx, ry);
        }
    }
    return new Float32Array(positionArray);
}