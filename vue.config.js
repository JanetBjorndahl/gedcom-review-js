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
          proxyReq.setHeader(
            "Cookie",
            "wikidb_session=fkjmq0kopb5gbacclbnbvuhm04; wikidbToken=5bb4994bf6375a827752290cf6b2bbca; wikidbUserID=2; wikidbUserName=Dallan"
          );
        }
      }
    }
  }
};
