/**
Copyright (C) 2019 Christopher Brandt

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.

Contact Info: xtopher.brandt at gmail
*/

'use strict';
 
const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const WineSearcherScraper = require('./wine-searcher-scraper');
const CellarTrackerScraper = require('./cellar-tracker-scraper');
const VivinoScraper = require('./vivino-scraper');

const app = express();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

// Add middleware to authenticate requests
//app.use(myMiddleware);

// build multiple CRUD interfaces:
//app.get('/:id', (req, res) => res.send(Widgets.getById(req.params.id)));
app.get('/', (req, res) => getFromCellarTracker( req, res ));
app.get('/detail', (req, res) => getFromCellarTrackerByUri( req, res ));

function getFromWineSearcher( req, res ){

    var vintage = getVintage( req );
    var bottleName = req.query.bottleName;

    startWineSearcherQuery( vintage, bottleName ).then( labels => {
        console.log( `   Found ${labels.length} labels`);
        var responseText = `Found ${labels.length} labels`
        res.send( labels );
        return responseText;
    },reason => {
        console.log ( `Look up failed` );
        console.log( reason );
        var responseText = `Sorry, I couldn't find any information on a ${labelQuery}`
        res.send( responseText );
    }).catch( error => {
        console.log ( `Look up error` );
        console.log( error );
        var responseText = `Sorry, I couldn't find any information on a ${labelQuery}`
        res.send( responseText );
    });
}

function getVintage( req ){
    if ( req.query.vintage ){
        return req.query.vintage;
    }
    else{
        return '';
    }
}

function startWineSearcherQuery( vintage, bottleName ){
    var wineSearcherScraper = new WineSearcherScraper();
    var labelQuery = `${vintage} ${bottleName}`;
   
    console.log( `Looking up: ${labelQuery}` );

    return wineSearcherScraper.wineLabelQuery( labelQuery );

}

function getFromCellarTracker( req, res ){

    var vintage = getVintage( req );
    var bottleName = req.query.bottleName;

    startCellarTrackerQuery( vintage, bottleName ).then( labels => {
        console.log( `   Found ${labels.length} labels`);
        var responseText = `Found ${labels.length} labels`
        res.send( labels );
        return responseText;
    },reason => {
        console.log ( `Look up failed` );
        console.log( reason );
        var responseText = `Sorry, I couldn't find any information on a ${vintage} ${bottleName}`
        res.send( responseText );
    }).catch( error => {
        console.log ( `Look up error` );
        console.log( error );
        var responseText = `Sorry, I couldn't find any information on a ${vintage} ${bottleName}`
        res.send( responseText );
    });
}

function startCellarTrackerQuery( vintage, bottleName ){
    var cellarTrackerScraper = new CellarTrackerScraper();
    var labelQuery = `${vintage} ${bottleName}`;
   
    console.log( `Looking up: ${labelQuery}` );

    return cellarTrackerScraper.wineLabelQuery( labelQuery );

}

function getFromCellarTrackerByUri( req, res ){

    var uri = req.query.uri;

    startCellarTrackerGet( uri ).then( labels => {
        console.log( `   Found ${labels.length} labels`);
        var responseText = `Found ${labels.length} labels`
        res.send( labels );
        return responseText;
    },reason => {
        console.log ( `Look up failed` );
        console.log( reason );
        var responseText = `Sorry, I couldn't load ${uri}`
        res.send( responseText );
    }).catch( error => {
        console.log ( `Look up error` );
        console.log( error );
        var responseText = `Sorry, I couldn't load ${uri}`
        res.send( responseText );
    });
}

function startCellarTrackerGet( uri ){
    var cellarTrackerScraper = new CellarTrackerScraper();
   
    console.log( `Fetching: ${uri}` );

    return cellarTrackerScraper.wineDetailGet( uri );

}


function getFromVivino( req, res ){

    var vintage = getVintage( req );
    var bottleName = req.query.bottleName;

    startVivinoQuery( vintage, bottleName ).then( labels => {
        console.log( `   Found ${labels.length} labels`);
        var responseText = `Found ${labels.length} labels`
        res.send( labels );
        return responseText;
    },reason => {
        console.log ( `Look up failed` );
        console.log( reason );
        var responseText = `Sorry, I couldn't find any information on a ${labelQuery}`
        res.send( responseText );
    }).catch( error => {
        console.log ( `Look up error` );
        console.log( error );
        var responseText = `Sorry, I couldn't find any information on a ${labelQuery}`
        res.send( responseText );
    });
}

function startVivinoQuery( vintage, bottleName ){
    var vivinoScraper = new VivinoScraper();
    var labelQuery = `${vintage} ${bottleName}`;
   
    console.log( `Looking up: ${labelQuery}` );

    return vivinoScraper.wineLabelQuery( labelQuery );

}
// Expose Express API as a single Cloud Function:
module.exports = app;