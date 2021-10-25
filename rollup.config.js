const commonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const json = require('@rollup/plugin-json');
const esbuild = require('rollup-plugin-esbuild');

module.exports = {
    input: 'Scripts/main.js',
    plugins: [
        esbuild({
            include: /\.[jt]sx?$/, // default, inferred from `loaders` option
            minify: false,
            target: 'es2015'
        }),
        commonjs(),
        nodeResolve({
            browser: true
        }),
        json()
    ],
    output: {
        file: 'texttools.novaextension/Scripts/main.dist.js',
        sourcemap: false,
        format: 'cjs'
    }
};
