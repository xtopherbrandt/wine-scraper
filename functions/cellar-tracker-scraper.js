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


const jsdom = require( 'jsdom' );
const { JSDOM } = jsdom;

const MAX_NUMBER_OF_RESULTS = 5;
const DetailPage = require( './cellar-tracker-detail-page' );
const SearchResultsPage = require( './cellar-tracker-search-results-page');

module.exports = class CellarTrackerScraper {

    constructor ( ){
        this.url = 'https://www.cellartracker.com/m/wines/search';
    }
    
    wineLabelQuery( queryString ){
        const cookieJar = new jsdom.CookieJar( null, { looseMode: true, rejectPublicSuffixes: false});

        var getUri = `${this.url}?q=${queryString}`;
        
        console.log( `Cellar-Tracker uri: ${getUri}`);

        var jsDomPromise = JSDOM.fromURL( getUri, { pretendToBeVisual: true, userAgent: 'Mozilla/5.0 (Linux; Android 8.0.0;) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.116 Mobile Safari/537.36', cookieJar, resources: "usable", runScripts: "outside-only" } );

        jsDomPromise.then( dom => this.resolve( this.mapEachResult( dom, cookieJar )) ).catch(err => {
            if ( err.statusCode === 403 ){
                console.log( 'Cellar Tracker returned a 403 from search.' );
                this.resolve( [] );
            }
            else{
                console.log('Error scraping cellar tracker', err.message );
                this.reject( new Error(`Error searching for ${queryString}`) );
            }
            
        });

        return new Promise((resolve, reject) => {this.resolve = resolve; this.reject = reject;} );

    }
    
    mapEachResult( dom, cookieJar ){
        const { window } = dom.window;
        const $ = require( 'jquery' )(window);
 
        if ( this.isSearchResultsPage( dom ) ){

            var searchResultsPage = new SearchResultsPage( dom );
            searchResultsPage.parseSearchResults();

            return searchResultsPage.wineInfoArray;

        }
        else{
            var detailPage = new DetailPage( dom );
            return detailPage.getWineDetail();
        }

    }
 
    isSearchResultsPage( dom ){
        return dom.window.location.href.includes( 'search');
    }

    getWineLabelDetail( getUri, cookieJar ){
        
        console.log( `Wine uri: ${getUri}`);

        var jsDomPromise = JSDOM.fromURL( getUri, { pretendToBeVisual: true, userAgent: 'Mozilla/5.0 (Linux; Android 8.0.0;) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.116 Mobile Safari/537.36', cookieJar, resources: "usable", runScripts: "outside-only" });

        return jsDomPromise.then( dom => new DetailPage( dom ).getWineDetail() ).catch(err => {
            if ( err.statusCode === 403 ){
                console.log( 'Cellar tracker returned a 403 from wine detail' );
                this.resolve( [] );
            }
            else{
                console.log('Error scraping wine detail from cellar tracker', err );
                this.reject( );
            }
            
        });

    }



}
