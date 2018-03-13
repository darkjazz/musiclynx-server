var express = require('express');
var fs = require('fs');
var uris = require('./uris').uris;
var path = require('path');

const api_dir = "./api/";

var processFile = function(content) {
  var html = "";
  var regex = /\/\*([\S\s]*?)\*\//gm;
  var comments = content.match(regex);
  if (comments) {
    comments.forEach(comment => {
      comment = comment.replace("/*", "").replace("*/", "").replace("\n", "<br>");
      if (comment.indexOf("Module:") > -1) {
        html += '<h2>' + comment.replace("Module: ", "") + '</h2>'
      }
      else {
        var uri_re = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gm;
        var uri = uri_re.exec(comment)[0];
        comment = comment.replace("Example:", "<br>Example:");
        comment = comment.replace("where", "<br>where");
        comment = comment.replace(uri, "<a href='" + uri + "'>" + uri + "</a>");
        html += comment + "<br>";
      }
    });
  }
  return html
}

var writeFront = function(template) {
  var output = "";
  var filenames = fs.readdirSync(api_dir);
  filenames.forEach(filename => {
    if (filename.indexOf(".js") > -1) {
      output += processFile(fs.readFileSync(path.join(api_dir, filename), 'utf-8'));
    }
  });
  return template.replace("%CONTENT%", output)

}

module.exports.serve_front = function() {
  var index = fs.readFileSync(uris.front_template_path, 'utf-8');
  index = writeFront(index);
  return index;
}
