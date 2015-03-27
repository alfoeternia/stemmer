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
   * Returns documents id from a list composed of:
   * [docId, Frequency]
   * 
   * @param array The array to extract information from
   */
  this.removeFreqFromDocList = function(array) {

    var docs = [];
    array.forEach(function(i) { docs.push(i[0]); });

    return docs;
  }


  /*
   * Returns the documents list for a term
   *
   * @param term The term to look for
   * @param index The inverted index
   */
  this.docsContainingTerm = function(term, index) {

    if(index[term]) return this.removeFreqFromDocList(index[term][1]);
    return [];
  }

}

module.exports = new Tools();