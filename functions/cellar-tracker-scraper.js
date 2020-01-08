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
const Label = require('./label.js');
const MAX_NUMBER_OF_RESULTS = 5;

module.exports = class CellarTrackerScraper {

    constructor ( ){
        this.url = 'https://www.cellartracker.com/m/wines/search';
    }
    
    wineLabelQuery( queryString ){
        const cookieJar = new jsdom.CookieJar( null, { looseMode: true, rejectPublicSuffixes: false});

        var getUri = `${this.url}?q=${queryString}`;
        
        console.log( `Cellar-Tracker uri: ${getUri}`);

        var jsDomPromise = JSDOM.fromURL( getUri, { pretendToBeVisual: true, userAgent: 'Mozilla/5.0 (win32) AppleWebKit/537.36 (KHTML, like Gecko)', cookieJar, resources: "usable", runScripts: "outside-only" } );

        var mapResultPromise = jsDomPromise.then( dom => this.mapEachResult( dom, cookieJar ) ).catch(err => {
            if ( err.statusCode === 403 ){
                console.log( 'Cellar Tracker returned a 403 from search.' );
                this.resolve( [] );
            }
            else{
                console.log('Error scraping cellar tracker', err.message );
                this.reject( new Error(`Error searching for ${queryString}`) );
            }
            
        });
        
        mapResultPromise.then( labelList => this.resolve( labelList ) ).catch( err => {
            console.log( `error waiting in wineLabelQuery: ${err}`);
        });

        return new Promise((resolve, reject) => {this.resolve = resolve; this.reject = reject;} );

    }
    
    mapEachResult( dom, cookieJar ){
        const { window } = dom.window;
        const $ = require( 'jquery' )(window);
 
        //console.log( cookieJar.toJSON() );
        
        return new Promise( (resolve, reject) => {
            var results = this.getSearchResults( $ );

            if ( results.length > 0 ){

                var labelPromiseList = results.map((index, link) => {
                    if ( index < MAX_NUMBER_OF_RESULTS ){
                        return this.getWineLabelDetail( link, cookieJar ).catch( err => {
                            console.log( `map error ${err.message}`);
                        });
                    }

                });
                
                resolve ( Promise.all( labelPromiseList ) );

            }
            else{
                reject( new Error( 'No results') );
            }
        });
         
    }
    
    getWineLabelDetail( getUri, cookieJar ){
        
        console.log( `Wine uri: ${getUri}`);

        var jsDomPromise = JSDOM.fromURL( getUri, { pretendToBeVisual: true, userAgent: 'Mozilla/5.0 (win32) AppleWebKit/537.36 (KHTML, like Gecko)', cookieJar, resources: "usable", runScripts: "outside-only" });

        return jsDomPromise.then( dom => this.scrapeWineDetail( dom ) ).catch(err => {
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

    scrapeWineDetail( dom ) { 
        const { window } = dom.window;
        const $ = require( 'jquery' )(window);
        var wine = {};
        var label;

        wine.sourceName = 'CellarTracker';
        wine.sourceID = this.getWineId( $ );
        wine.varietal = this.getVarietal( $ );
        wine.producer = this.getProducer( $ );

        wine.locale = this.getLocale( $ );
        wine.vintage = this.getVintage( $ );
        wine.labelName = this.getLabelName( $ );

        if ( wine.labelName ){
            wine.imageUrl = this.getLabelImageUrl( $ );
            wine.criticsScore = this.getCriticScore( $ );
            wine.style = this.getStyle( $ );
            wine.averagePrice = this.getAveragePrice( $ );
            wine.communityScore = this.getCommunityScore( $ );
            wine.foodPairing = this.getFoodPairing( $ );
            wine.attribution = window.location.href;
            wine.designation = this.getDesignation( $ );
            wine.vineyard = this.getVineyard( $ );
    
            console.log( wine );
    
            label = this.createLabel( wine );
        }
        else{
            label = new Label();
        }
    
        return label;
    }

    getSearchResults( $ ){
        return $("div.wine-result-data > a.target-link");
    }

    getWineId ( $ ){
        return $("div.wine-detail > a.wine-button").attr("data-wineid");
    }

    getProducer( $ ){        
        return $("div[data-setting='MobileWineDetails'] > ul > li:nth-child(3)" ).text().slice( "Producer".length + 1 );
    }

    getVarietal( $ ){
        return $("div[data-setting='MobileWineDetails'] > ul > li:nth-child(4)" ).text().slice( "Varietal".length + 1 );
        
    }

    getLocale( $ ){
        var locale = {};
        locale.country = $("div[data-setting='MobileWineDetails'] > ul > li:nth-child(7)" ).text().slice( "Country".length + 1 );
        locale.region = $("div[data-setting='MobileWineDetails'] > ul > li:nth-child(8)" ).text().slice( "Region".length + 1 );
        locale.subRegion = $("div[data-setting='MobileWineDetails'] > ul > li:nth-child(9)" ).text().slice( "SubRegion".length + 1 );
        locale.appellation = $("div[data-setting='MobileWineDetails'] > ul > li:nth-child(10)" ).text().slice( "Appellation".length + 1 );
        
        return locale
    }

    getVintageAndLabelName( $ ){
        return $("div.wine-detail > h1" ).text();
    }

    separateLabelNameAndVintage( $ ){
        // 1: Vintage
        // 2: Label Name
        return /(\d{4}|NV)\s([\w\s-&'.]*)/.exec( this.getVintageAndLabelName( $ ) );
    }

    getVintage( $ ){

        return this.separateLabelNameAndVintage( $ ) ? this.separateLabelNameAndVintage( $ )[ 1 ] : '';
    }

    getLabelName( $ ){
        return this.separateLabelNameAndVintage( $ ) ? this.separateLabelNameAndVintage( $ )[ 2 ] : '';
    }

    getDesignation( $ ){
        return $("div[data-setting='MobileWineDetails'] > ul > li:nth-child(5)" ).text().slice( "Desgination".length + 1 );
    }
    
    getVineyard( $ ){
        return $("div[data-setting='MobileWineDetails'] > ul > li:nth-child(6)" ).text().slice( "Vineyard".length + 1 );
    }

    getLabelImageUrl( $ ){
        return $( "div.label-image:nth-child(1) > img" ).attr("src");
    }

    getCriticScore( $ ){
        return '';
    }

    getCommunityScore( $ ){
        return $("div.scores > a").text().slice( "CT".length );
    }

    getStyle( $ ){
        return $("div[data-setting='MobileWineDetails'] > ul > li:nth-child(2)" ).text().slice( "Type".length + 1 );
    }

    getFoodPairingCommunityRecommendations( $ ){
        return $("div[data-setting='MobileWineFoodPairing'] > div.subsection-content" ).text();
    }

    getFoodPairing( $ ){
        var foodPairingCommunityRecommendations = this.getFoodPairingCommunityRecommendations( $ );
        if ( foodPairingCommunityRecommendations ){
            var foodPairing = /\n\t\t\tCommunity Recommendations\n\t\t\t\s([\s\w\,]+)\n\t\t/.exec( foodPairingCommunityRecommendations );
            if ( foodPairing ){
                console.log( foodPairing );
                return foodPairing[1];
            }
        }

        return '';
    }

    getAveragePrice( $ ){
        var priceText = '';
        return priceText.replace(/\s/g,'');
    }

    createLabel( wine ){
        
        var label = new Label( wine.vintage, wine.varietal, wine.producer, wine.labelName, wine.designation, wine.imageUrl, wine.locale.country, wine.locale.region, wine.locale.subRegion, wine.locale.appellation, vineyard, '', wine.style, wine.averagePrice, wine.criticsScore, wine.communityScore, wine.foodPairing, wine.sourceName, wine.sourceID );
    
        return label;
    }

}
