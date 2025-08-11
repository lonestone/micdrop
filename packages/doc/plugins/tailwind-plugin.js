function tailwindPlugin(context, options) {
  return {
    name: 'tailwind-plugin',
    configurePostCss(postcssOptions) {
      // Append TailwindCSS and AutoPrefixer
      postcssOptions.plugins.push(require('tailwindcss'))
      postcssOptions.plugins.push(require('autoprefixer'))
      return postcssOptions
    },
  }
}

module.exports = tailwindPlugin