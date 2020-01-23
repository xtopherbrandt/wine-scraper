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


module.exports = class CellarTrackerSearchResultsPage {

    constructor ( dom ){
        const { window } = dom.window;
        this.dom = dom;
        this.$ = require( 'jquery' )(window);
        this.wineInfoArray = [];
    }
    
    getWineDetail( element ) { 

        var wineInfo = {};

        wineInfo.sourceName = 'CellarTracker';
        wineInfo.detailLink = this.getWineDetailLink( element );

        wineInfo.vintage = this.getVintage( element );
        wineInfo.labelName = this.getLabelName( element );
        wineInfo.style = this.getStyle( element );

        wineInfo.attribution = this.dom.window.location.href;

    
        this.wineInfoArray.push( wineInfo );
    }

    parseSearchResults (){
        this.$("div.wine-result").each( (i, element) => this.getWineDetail( element ));
    }

    getWineDetailLink ( element ){
        return element.querySelector("div.wine-result-data > a.target-link").href;
    }

    getVintageAndLabelName( element ){
        return element.querySelector("div.wine-result-data > a.target-link" ).text;
    }

    separateLabelNameAndVintage( element ){
        // 1: Vintage
        // 2: Label Name
        return /(\d{4}|NV)\s([A-zÀ-ú\s-&'.]*)/.exec( this.getVintageAndLabelName( element ) );
    }

    getVintage( element ){

        return this.separateLabelNameAndVintage( element ) ? this.separateLabelNameAndVintage( element )[ 1 ] : '';
    }

    getLabelName( element ){
        return this.separateLabelNameAndVintage( element ) ? this.separateLabelNameAndVintage( element )[ 2 ] : '';
    }

    getSubTextArray( element ){
        return element.querySelector("div.wine-result-data > span.subtext" ).map(value => value.text());
    }

    getStyle( element ){
        return element.querySelector("div.wine-result > a.wine-button" ).text;
    }
}