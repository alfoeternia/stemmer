#!/usr/bin/env node
/*
 * Tools used by the stemmer or search engine.
 *
 * @author Alexis Fouché <contact@alexisfouche.net>
 */

'use strict';

function Tools() {
  /*
   * Intersects two arrays.
   *
   * @param a The first array, must already be sorted
   * @param b The second array, must already be sorted
   */
  this.intersect = function(a, b)
  {
    var result = new Array();
    while( a.length > 0 && b.length > 0 )
    {  
       if      (a[0] < b[0] ){ a.shift(); }
       else if (a[0] > b[0] ){ b.shift(); }
       else /* they're equal */
       {
         result.push(a.shift());
         b.shift();
       }
    }

    return result;
  }

  /*
   * Compute the union of two arrays.
   *
   * @param a The first array, must already be sorted
   * @param b The second array, must already be sorted
   */
  this.union = function(a, b) 
  {
      var r = a.slice(0);
      b.forEach(function(i) { if (r.indexOf(i) < 0) r.push(i); });
      return r;
  };

  /*
   * Sort the properties of an Object.
   * Useful when an Object is used as an associative array (hashmap).
   * Downloaded from: http://stackoverflow.com/a/1359808
   *
   * @param o The object to sort
   */
  this.sortObject = function(o) {
      var sorted = {},
      key, a = [];

      for (key in o) {
      	if (o.hasOwnProperty(key)) {
      		a.push(key);
      	}
      }

      a.sort();

      for (key = 0; key < a.length; key++) {
      	sorted[a[key]] = o[a[key]];
      }
      return sorted;
  }

  /*
   * Returns document ids from a list composed of:
   * [docId, Frequency]
   * 
   * @param a The array to extract information from
   */
  this.removeFreqFromDocList = function(a) {

    var d = [];
    a.forEach(function(i) { d.push(i[0]); });

    return d;
  }


  /*
   * Returns the documents list for a term
   *
   * @param term The term to look for
   * @param idx The inverted index
   */
  this.docsContainingTerm = function(term, idx) {

    if(idx[term]) return this.removeFreqFromDocList(idx[term][1]);
    return [];
  }

  /*
   * Capitalize the first letter of each word
   *
   * @from http://bit.ly/1H8Xr4V
   */
  this.toTitleCase = function(str) {
      return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  }

}

module.exports = new Tools();