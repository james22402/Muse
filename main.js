// Modules to control application life and create native browser window
const {app, remote, ipcMain} = require('electron');
const path = require('path');
const Window = require('./Components/Window.js');
const pdfreader = require("pdfreader");
const HummusRecipe = require('hummus-recipe');

const keywords = ["Prelude", "Welcome", "Introit", "Call%20to%20Worship", "Hymn", "Prayer%20of%20Invocation", "Lord%E2%80%99s%20Prayer", "Children%E2%80%99s%20Moment", "Scripture", "Sermon", "Sacrament%20of%20Communion", "Prayer%20of%20Thanksgiving", "Communion%20Response", "Announcements", "Benediction", "Benediction%20Response", "Postlude"];

function main() {
  let mainWindow = new Window({
    file: 'src/html/index.html',
    width: 800,
    height: 1200,
    frame: false,
     backgroundColor: '#FFF',
    webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        plugins: true
    }
  })
  mainWindow.webContents.openDevTools()
}

app.on('ready', main)

app.on('window-all-closed', function() {
  app.quit();
})

ipcMain.handle('generate-cues', async (event, pdf) => {
  console.log(pdf)
  var padding = 10

  getPDFMatches(pdf.path).then((matches) => {
    console.log("Post reader")
    console.log(matches)
    currentPage = matches[0].page
    matches.forEach(element => {
      if (element.page > currentPage) {
        currentPage = element.page
      }
      const pdfDoc = new HummusRecipe(pdf.path, pdf.path);
      pdfDoc
        .editPage(currentPage)
        .rectangle(element.x, element.y, element.w, 20+padding/2,{
          stroke: '#3b7721',
          lineWidth: 1
      })
        .moveTo(element.x+element.w,element.y+(20+padding/2)/2)
        .lineTo(600,element.y+(20+padding/2)/2,{
          stroke: '#3b7721',
          lineWidth: 1
      })
        .endPage()
        .endPDF();
    });
  }).catch((err) => {
    console.log(err)
  });
  
});

async function getPDFMatches(pdfPath) {
  var currentPage = 0
  var matches = [];
  return new Promise((resolve, reject) => {
    new pdfreader.PdfReader().parseFileItems(pdfPath, function(err, item) {
      if (err){
        console.log(err)
      }
      else if (!item){
        resolve(matches)
      }
      else if(item.page){
        //console.log(item)
        currentPage = item.page
      }
      else if (item.text){
        if(keywords.some(word => item.R[0].T.includes(word))){
          var padding = 10
          item.page = currentPage
          console.log(item)
          matches.push({"match": item.text, "x": item.x*20-padding, "y": item.y*16, "w": item.w, "page": item.page, "sw": item.sw})
        }
        else if(item.text.includes('Response') || item.text.includes('Communion'))
        {
          console.log(`###################################################################`)
          console.log(`Debugging...`)
          console.log(`###################################################################`)
          console.log(item)
          console.log(`###################################################################`)
          console.log(`Debugging...`)
          console.log(`###################################################################`)
        }
      }
    });
  });
}