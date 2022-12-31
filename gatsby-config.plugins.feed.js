const config = require('./config');
const utils = require('./src/utils');

module.exports = {
  resolve: `gatsby-plugin-feed`,
  options: {
    query: `
      {
        site {
          siteMetadata {
            title
            description
            siteUrl
            site_url: siteUrl
          }
        }
      }
    `,
    feeds: [
      {
        serialize: ({ query: { allMarkdownRemark } }) => {
          return allMarkdownRemark.edges.map(({ node }) => {
            const { siteUrl, pathPrefix, author } = config
            const { title, date, path, excerpt } = node.frontmatter
            return Object.assign({}, node.frontmatter, {
              title: title,
              description: excerpt,
              url: utils.resolveUrl(siteUrl, pathPrefix, path),
              guid: siteUrl + path + title,
              date: date,
              author: author,
              custom_elements: [
                { "content:encoded": node.html }
              ],
            })
          })
        },
        query: `
          {
            allMarkdownRemark(
              limit: 10,
              sort: { order: DESC, fields: [frontmatter___date] }
            ) {
              edges {
                node {
                  html
                  frontmatter {
                    title
                    date
                    path
                    excerpt
                  }
                }
              }
            }
          }
        `,
        output: "/rss.xml",
        title: "Devon Smith RSS Feed",
      },
    ],
  },
}