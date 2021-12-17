import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';

const watch = Boolean(process.env.ROLLUP_WATCH);

const pluginName = 'LogSystem';

const outputFile = `${pluginName}.js`;
const outputDirectory = watch ? `./../../DTCD/server/plugins/DTCD-${pluginName}` : `./build`;

const plugins = [resolve(), babel({ babelHelpers: 'bundled' })];

export default {
  input: './src/LogSystem.js',
  output: {
    file: `${outputDirectory}/${outputFile}`,
    format: 'esm',
    sourcemap: false,
  },
  watch: {
    include: ['./*/**'],
  },
  plugins,
};
