import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';

const watch = Boolean(process.env.ROLLUP_WATCH);

const pluginName = 'LogSystem';

const output = watch ? `./../../DTCD/server/plugins/${pluginName}.js` : `./build/${pluginName}.js`;

const plugins = [resolve(), babel({babelHelpers: 'bundled'})];

export default {
	input: './src/LogSystem.js',
	output: {
		file: output,
		format: 'esm',
		sourcemap: false,
	},
	watch: {
		include: ['./*/**'],
	},
	plugins,
};
