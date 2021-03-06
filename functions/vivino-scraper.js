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

module.exports = class VivinoScraper {

    constructor ( ){
        this.url = 'https://www.vivino.com/search/wines';
    }
    
    wineLabelQuery( queryString ){

        var getUri = `${this.url}?q=${queryString}`;
        
        console.log( `Vivno uri: ${getUri}`);

        var jsDomPromise = JSDOM.fromURL( getUri, { pretendToBeVisual: true, userAgent: 'Mozilla/5.0 (win32) AppleWebKit/537.36 (KHTML, like Gecko)' });

        jsDomPromise.then( dom => this.mapEachResult( dom ) ).catch(err => {
            if ( err.statusCode === 403 ){
                console.log( 'CAUGHT!' );
                this.resolve( [] );
            }
            else{
                console.log('Error scraping cellar tracker', err );
                this.reject( );
            }
            
        });

        return new Promise((resolve, reject) => {this.resolve = resolve; this.reject = reject;} );

    }

    mapEachResult( dom ){
        const { window } = dom.window;
        const $ = require( 'jquery' )(window);

        var results = this.getSearchResults( $ );
        console.log( results );

        this.resolve([]);
    }

    queryPromiseFulfilled( dom ) { 
        const { window } = dom.window;
        const $ = require( 'jquery' )(window);
        var wine = {};
        wine.varietal = this.getGrape( $ );
        wine.producer = this.getProducer( $ );

        console.log( wine );

        wine.locale = this.getRegion( $ );
        wine.locale.appellation = this.getAppellation( $ );
        wine.vintage = this.getVintage( $ );
        wine.labelName = this.getLabelName( $ );

        if ( wine.labelName ){
            wine.imageUrl = this.getLabelImageUrl( $ );
            wine.criticsScore = this.getCriticScore( $ );
            wine.style = this.getStyle( $ );
            wine.averagePrice = this.getAveragePrice( $ );
            wine.communityScore = 0;
            wine.foodPairing = this.getFoodPairing( $ );
            wine.attribution = window.location.href;
    
            //console.log( wine );
    
            this.label = this.createLabel( wine );
        }
        else{
            this.label = new Label();
        }
    
        this.resolve( [this.label] );
    }

    getSearchResults( $ ){
        return $("#wrapper" );
    }

    getSearchResultURI( result ){
        return $("a.more").attr("href");
    }


    getProducer( $ ){        
        return $("span.icon-producer" ).next().children("a").text();
    }

    getGrape( $ ){
        return $("span.el.var" ).first().text();
    }

    getAppellation( $ ){
        return $("span.icon-region" ).next().children("a").first().text();
    }

    getRegion( $ ){
        var regionSelector = $("span.icon-region" ).next().children("a").nextAll();
        return this.separateRegion( regionSelector );
    }

    getTopHeaderName( $ ){
        
        return $("#top_header" ).children("[itemprop='name']").text();
    }

    parseTopHeaderName( $ ){
        // 1: Vintage
        // 2: Label Name
        return /(\d{4}|NV)\s([\w\s-&'.]*),/.exec( this.getTopHeaderName( $ ) );
    }

    getVintage( $ ){

        return this.parseTopHeaderName( $ ) ? this.parseTopHeaderName( $ )[ 1 ] : '';
    }

    getLabelName( $ ){
        return this.parseTopHeaderName( $ ) ? this.parseTopHeaderName( $ )[ 2 ] : '';
    }

    getLabelImageUrl( $ ){
        return $( "#imgThumb" ).attr("src");
    }

    getCriticScore( $ ){
        return $("span[itemprop='ratingValue']").text();
    }

    getStyle( $ ){
        return $("a[title='View Wine Style']").text();
    }

    getFoodPairing( $ ){

        return $("a[title='View Food Category']").text();
    }

    getAveragePrice( $ ){
        var priceText = $("span.icon-avgp").next().children("b").text();
        return priceText.replace(/\s/g,'');
    }

    separateRegion( regionSelector ){
        var splitRegion = {};
        var regionParts = regionSelector.text().split( ",");
        console.log( regionParts );
        var index = regionParts.length - 1;

        splitRegion.country = regionParts[ index-- ];
        
        if ( index >= 0 ){
            splitRegion.region = regionParts[ index-- ];
        }

        if ( index > 0 ){
            splitRegion.subRegion = regionParts[ index-- ];
        }

        
        return splitRegion;
    }

    createLabel( wine ){
        
        var label = new Label( wine.vintage, wine.varietal, wine.producer, wine.labelName, '', wine.imageUrl, wine.locale.country, wine.locale.region, wine.locale.subRegion, wine.locale.appellation,'', wine.style, wine.averagePrice, wine.criticsScore, wine.communityScore, wine.foodPairing );
    
        return label;
    }

}
