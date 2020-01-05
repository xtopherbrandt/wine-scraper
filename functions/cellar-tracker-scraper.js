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

module.exports = class CellarTrackerScraper {

    constructor ( ){
        this.url = 'https://www.cellartracker.com/list.asp';
    }
    
    wineLabelQuery( queryString ){
        const cookieJar = new jsdom.CookieJar();

        var getUri = `${this.url}?szSearch=${queryString}`;
        
        console.log( `Cellar-Tracker uri: ${getUri}`);

        var jsDomPromise = JSDOM.fromURL( getUri, { pretendToBeVisual: true, userAgent: 'Mozilla/5.0 (win32) AppleWebKit/537.36 (KHTML, like Gecko)', cookieJar, resources: "usable", runScripts: "dangerously" });

        jsDomPromise.then( dom => this.mapEachResult( dom, cookieJar ) ).catch(err => {
            if ( err.statusCode === 403 ){
                console.log( 'Cellar Tracker returned a 403 from search.' );
                this.resolve( [] );
            }
            else{
                console.log('Error scraping cellar tracker', err );
                this.reject( );
            }
            
        }).then( labelList => this.resolve( labelList ) ).catch( err => {
            console.log( `error waiting in wineLabelQuery: ${err}`);
        });

        return new Promise((resolve, reject) => {this.resolve = resolve; this.reject = reject;} );

    }
    
    mapEachResult( dom, cookieJar ){
        const { window } = dom.window;
        const $ = require( 'jquery' )(window);
        var labelList = [];

        console.log( cookieJar.toJSON() );

        var results = this.getSearchResults( $ );
        var labelPromiseList = results.map((index, link) => {
            return this.getWineLabelDetail( link, cookieJar ).then( label => labelList.push( label )).catch( err => {
                console.log( `map error ${err}`);
            });
        });
        
        return Promise.all( labelPromiseList ).then( () => this.resolve( labelList )).catch( err => {
            console.log( `error waiting for all mapping promises to resolve: ${err}`);
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
        wine.sourceID = /iWine=\d{1,9}/.exec( dom.window.document.documentURI )[ 0 ];
        wine.varietal = this.getGrape( $ );
        wine.producer = this.getProducer( $ );

        wine.locale = this.getLocale( $ );
        wine.vintage = this.getVintage( $ );
        wine.labelName = this.getLabelName( $ );

        console.log( wine );

        if ( wine.labelName ){
            wine.imageUrl = this.getLabelImageUrl( $ );
            wine.criticsScore = this.getCriticScore( $ );
            wine.style = this.getStyle( $ );
            wine.averagePrice = this.getAveragePrice( $ );
            wine.communityScore = this.getCommunityScore( $ );
            wine.foodPairing = this.getFoodPairing( $ );
            wine.attribution = window.location.href;
    
            //console.log( wine );
    
            label = this.createLabel( wine );
        }
        else{
            label = new Label();
        }
    
        return label;
    }

    getSearchResults( $ ){
        return $("a.more");
    }

    getProducer( $ ){        
        return $("#section_tools > ul.breadcrumb > li:nth-child(2) > div > a > span" ).text();
    }

    getGrape( $ ){
        return $("#wine_copy_inner > h2 > a" ).text();
        
    }

    getLocale( $ ){
        var locale = {};
        locale.country = $("#wine_copy_inner > ul > li:nth-child(1) > a").text();
        locale.region = $("#wine_copy_inner > ul > li:nth-child(2) > a").text();
        locale.subRegion = $("#wine_copy_inner > ul > li:nth-child(3) > a").text();
        locale.appellation = $("#wine_copy_inner > ul > li:nth-child(4) > a").text();

        return locale
    }

    getVintageAndLabelName( $ ){
        return $("#wine_copy_inner > h1" ).text();
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

    getLabelImageUrl( $ ){
        return $( "#label_photo > img" ).attr("src");
    }

    getCriticScore( $ ){
        return '';
    }

    getCommunityScore( $ ){
        return $("#wine_copy_inner > div.scorebox > span.score > a").text();
    }

    getStyle( $ ){
        return '';
    }

    getFoodPairing( $ ){
        return '';
    }

    getAveragePrice( $ ){
        var priceText = $("#where_to_buy_container > div.col_1of2 > a > div.price").text();
        return priceText.replace(/\s/g,'');
    }

    createLabel( wine ){
        
        var label = new Label( wine.vintage, wine.varietal, wine.producer, wine.labelName, '', wine.imageUrl, wine.locale.country, wine.locale.region, wine.locale.subRegion, wine.locale.appellation,'', wine.style, wine.averagePrice, wine.criticsScore, wine.communityScore, wine.foodPairing, wine.sourceName, wine.sourceID );
    
        return label;
    }

}
