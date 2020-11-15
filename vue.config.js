module.exports = {
  publicPath: process.env.NODE_ENV === "production" ? "/gedcom-review/" : "/",
  transpileDependencies: ["vuetify"],
  configureWebpack: {
    plugins: []
  },
  devServer: {
    proxy: {
      "/(w|wiki)/": {
        target: "https://www.werelate.org",
        changeOrigin: true,
        onProxyReq: function(proxyReq) {
          proxyReq.setHeader("Cookie", "wikidb_session=???; wikidbUserID=???; wikidbUserName=???");
        }
      }
    }
  }
};
