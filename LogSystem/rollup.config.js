const watch = Boolean(process.env.ROLLUP_WATCH);

const pluginName = 'LogSystem';

const output = watch ? `./../../DTCD/server/plugins/${pluginName}.js` : `./dist/${pluginName}.js`;

const plugins = [];

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
