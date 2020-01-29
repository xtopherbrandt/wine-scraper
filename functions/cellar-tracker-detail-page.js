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

const Label = require('./label.js');


module.exports = class CellarTrackerDetailPage {

    constructor ( dom ){
        const { window } = dom.window;
        this.dom = dom;
        this.$ = require( 'jquery' )(window);
    }
    
    getWineDetail( ) { 

        var wine = {};
        var label;

        wine.sourceName = 'CellarTracker';
        wine.sourceID = this.getWineId( );
        wine.varietal = this.getVarietal( );
        wine.producer = this.getProducer( );

        wine.locale = this.getLocale( );
        wine.vintage = this.getVintage( );
        wine.labelName = this.getLabelName( );

        if ( wine.labelName ){
            wine.imageUrl = this.getLabelImageUrl( );
            wine.criticsScore = this.getCriticScore( );
            wine.style = this.getStyle( );
            wine.averagePrice = this.getAveragePrice( );
            wine.communityScore = this.getCommunityScore( );
            wine.foodPairing = this.getFoodPairing( );
            wine.attribution = this.dom.window.location.href;
            wine.designation = this.getDesignation( );
            wine.vineyard = this.getVineyard( );
    
            console.log( wine );
    
            label = this.createLabel( wine );
        }
        else{
            label = new Label();
        }
    
        return [label];
    }

    getWineId ( ){
        return this.$("div.wine-detail > a.wine-button").attr("data-wineid");
    }

    getProducer( ){        
        return this.$("div[data-setting='MobileWineDetails'] > ul > li:nth-child(3)" ).text().slice( "Producer".length + 1 );
    }

    getVarietal( ){
        return this.$("div[data-setting='MobileWineDetails'] > ul > li:nth-child(4)" ).text().slice( "Varietal".length + 1 );
        
    }

    getLocale( ){
        var locale = {};
        locale.country = this.$("div[data-setting='MobileWineDetails'] > ul > li:nth-child(7)" ).text().slice( "Country".length + 1 );
        locale.region = this.$("div[data-setting='MobileWineDetails'] > ul > li:nth-child(8)" ).text().slice( "Region".length + 1 );
        locale.subRegion = this.$("div[data-setting='MobileWineDetails'] > ul > li:nth-child(9)" ).text().slice( "SubRegion".length + 1 );
        locale.appellation = this.$("div[data-setting='MobileWineDetails'] > ul > li:nth-child(10)" ).text().slice( "Appellation".length + 1 );
        
        return locale
    }

    getVintageAndLabelName( ){
        return this.$("div.wine-detail > h1" ).text();
    }

    separateLabelNameAndVintage( ){
        // 1: Vintage
        // 2: Label Name
        return /(\d{4}|NV)\s([\w\s-&'.]*)/.exec( this.getVintageAndLabelName( ) );
    }

    getVintage( ){

        return this.separateLabelNameAndVintage( ) ? this.separateLabelNameAndVintage( )[ 1 ] : '';
    }

    getLabelName( ){
        return this.separateLabelNameAndVintage( ) ? this.separateLabelNameAndVintage( )[ 2 ] : '';
    }

    getDesignation( ){
        return this.$("div[data-setting='MobileWineDetails'] > ul > li:nth-child(5)" ).text().slice( "Desgination".length + 1 );
    }
    
    getVineyard( ){
        return this.$("div[data-setting='MobileWineDetails'] > ul > li:nth-child(6)" ).text().slice( "Vineyard".length + 1 );
    }

    getLabelImageUrl( ){
        return this.$( "div.label-image:nth-child(1) > img" ).attr("src");
    }

    getCriticScore( ){
        return '';
    }

    getCommunityScore( ){
        return this.$("div.scores > a").text().slice( "CT".length );
    }

    getStyle( ){
        return this.$("div[data-setting='MobileWineDetails'] > ul > li:nth-child(2)" ).text().slice( "Type".length + 1 );
    }

    getFoodPairingCommunityRecommendations( ){
        return this.$("div[data-setting='MobileWineFoodPairing'] > div.subsection-content" ).text();
    }

    getFoodPairing( ){
        var foodPairingCommunityRecommendations = this.getFoodPairingCommunityRecommendations( );
        if ( foodPairingCommunityRecommendations ){
            var foodPairing = /\n\t\t\tCommunity Recommendations\n\t\t\t\s([\s\w,]+)\n\t\t/.exec( foodPairingCommunityRecommendations );
            if ( foodPairing ){
                console.log( foodPairing );
                return foodPairing[1];
            }
        }

        return '';
    }

    getAveragePrice( ){
        var priceText = '';
        return priceText.replace(/\s/g,'');
    }
    
    createLabel( wine ){
        
        var label = new Label( wine.vintage, wine.varietal, wine.producer, wine.labelName, wine.designation, wine.imageUrl, wine.locale.country, wine.locale.region, wine.locale.subRegion, wine.locale.appellation, wine.vineyard, '', wine.style, wine.averagePrice, wine.criticsScore, wine.communityScore, wine.foodPairing, wine.sourceName, wine.sourceID );
    
        return label;
    }
}