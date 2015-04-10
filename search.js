#!/usr/bin/env node
/*
 * Implementation of a search egine base on the generated
 * inverted index from the Cranfield collection.
 *
 * @author Alexis Fouche
 * @repository https://github.com/alfoeternia/stemmer
 * @version 1.0.3
 */

"use strict";

var fs          = require('fs');
var util        = require('util');
var program     = require('commander');
var table       = require('cli-table');
var stemmer     = require('porter-stemmer').stemmer;
var parser      = require("./parser");
var tools       = require('./tools');
var stopwords   = [];

process.stdin.setEncoding('utf8');
// Configure application
program
	.version('1.0.3')
	.usage('[options] <queries>')
	.option('-b, --binary', 'use a binary query string (currently unused)')
	.option('-i, --index <file>', 'specify a custom JSON-formatted inverted index file')
  	.option('-w, --stop-words <file>', 'specify a custom stopwords file')
	.option('-v, --verbose', 'enables verbose output')
	.parse(process.argv);

var indexFile = program.index || './docs/INV_FILE_HASH.json';
var index = require(indexFile);
var invertedIdx = index.index;
var wDs = index.wDs;
var docsInfo = index.docsInfo;
//var wDs = require('./docs/wDs.json');
var stopwordsFile = program.stopWords || './docs/stopwords.txt';
var queriesFile = program.queriesFile || './docs/cran.qry';


/*
 * Recursive function that analyzes a binary search tree
 * and return the list of documents matched by the query.
 * NB: stemming is done in this step, not during the parsing.
 *
 * @param node The node to begin with. Can be an inner node of the tree
 * @return int[]
 */
function binarySearch(node) {

	if(node.type == 'Identifier') {
		return tools.docsContainingTerm(stemmer(node.name), invertedIdx);
	}

	else if (node.type == 'UnaryExpression' && node.op == 'NOT') {
		var docs = binarySearch(node.arg);
		var output = [];

		// TODO: remove hardcoded value
		for(var i = 1; i < 1400; i++) {
			if(docs.indexOf(i) != -1) output.push(i);
		}
		return output;
	}

	else if (node.type == 'BinaryExpression' && node.op == 'AND') {
		return tools.intersect(binarySearch(node.left), binarySearch(node.right));
	}

	else if (node.type == 'BinaryExpression' && node.op == 'OR') {
		return tools.union(binarySearch(node.left), binarySearch(node.right));
	}

	else throw new Error('Error while processing binary tree search.'); 
}


// Process queries passed as parameter to the script
var queries = program.args;

/*for(var index in queries) {
	var query = queries[index];

	if(program.verbose) {
		console.log('================= Query ' + (parseInt(index) + 1));
		console.log('Input: ' + query);
		console.log('Query Tree: ');
		console.log(util.inspect(parser(query), {depth: 10, colors: true}));

		console.log('\nResults: ');
	}

	console.log(JSON.stringify(binarySearch(parser(query))));
}*/



function processQueriesFile(data) {
	var lines = data.split('\n');
	var lineIndex = 0;

	// While the entire file has not been processed
	while(lineIndex < lines.length) {

		// Find the query ID
		while(lines[lineIndex].slice(0, 2) != '.I') lineIndex++;
		var id = parseInt(lines[lineIndex].split(' ')[1]);

		// Find the beginning of the query
		while(lines[lineIndex].slice(0, 2) != '.W') lineIndex++;
		var idStart = lineIndex + 1;

		// Find the end of the text
		while(lines[lineIndex] != undefined && lines[lineIndex].slice(0, 2) != '.I') lineIndex++;
		var idStop = lineIndex;

		// Process query
		processQuery(id, lines, idStart, idStop);
	}
}

function processQuery(id, lines, idStart, idStop) {

	console.log('================ Query ' + id);

	var score = 0;

	// terms is an 1-dimension array
	var terms   = []

	// Go through every line of the query
	for(var i = idStart; i < idStop; i++) {

		var line = lines[i].toLowerCase();

		// Split the line in words by selecting only "group of characters"
		// using a regular expression, then filter the returned words
		// by removing those of one character or in the stopwords list.
		//
		// The \W notation (uppercase W) means [^A-Za-z0-9_], which is every
		// non-word character that I use for delimiter.
		var words = line.split(/\W+/).filter(function(w) {
			return w.length > 1 && stopwords.indexOf(w) == -1;
		});

		// Push the list of terms of the lines to the list of terms of the query
		Array.prototype.push.apply(terms, words.map(stemmer));

		console.log(tools.toTitleCase(line));
	}


	var docs = {};
	var wQ = 0;

	terms.forEach(function(t) {
		//console.log('* Analysing term', t);

		var termInfo = invertedIdx[t];
		if(termInfo !== undefined) {
			//console.log('  [OK] Term exists in index');

			var idf = Math.pow(Math.log(1 + 1400.0 / termInfo[0]), 2);
			wQ += idf;

			var docFreq = termInfo[1];
			for(var i = 0; i < docFreq.length; i++) {
				if (docs[docFreq[i][0]] == undefined) {
					docs[docFreq[i][0]] = (1 + Math.log(docFreq[i][1])) * idf;
				}
				else 
					docs[docFreq[i][0]] += (1 + Math.log(docFreq[i][1])) * idf;
			}

		} else {
			//console.warn('  [WARN] Term not present in index:', t);
		}

		/*var docFreq = invertedIdx[t][1];
		for(var i = 0; i < docFreq.length; i++) {
			if (vec[docFreq[i][0]] == undefined)
				vec[docFreq[i][0]] = docFreq[i][1];
			else 
				vec[docFreq[i][0]] += docFreq[i][1];
		}*/
	});

	wQ = Math.sqrt(wQ);

	// Add results to sortable array
	var sortable = [];
	for (var i in docs)
	    sortable.push([i, docs[i]])

	// Compute the final TF-IDF by dividing by wQ*wD
	for (var i in sortable)
	    sortable[i][1] *= 1.0/ (wQ * wDs[sortable[i][0]]);

	// Sort by TF-IDF score
	sortable.sort(function(a, b) {return b[1] - a[1]})

	// Display results
	var result = new table({ head: ['Doc Id', 'Title', 'Authors', 'Score'], colWidths: [8, 75, 20, 8] });
	for(var i = 0; i < 30; i++) {
		var doc = sortable[i];
		result.push([ 
			doc[0],
			tools.toTitleCase(docsInfo[doc[0]].title),
			tools.toTitleCase(docsInfo[doc[0]].authors),
			doc[1]]);
	}
	console.log(result.toString());

	// Compute and display stats
	var precision = 0;
	var recall = 0;

	for(var i = 0; sortable[i][1] > 0.40; i++) {
		var doc = sortable[i];

		for(var j = 0; j < queryExpectedResults[id].length; j++) {
			if(queryExpectedResults[id][j][0] == doc[0])
				precision++;
		}
	}

	recall = precision / queryExpectedResults[id].length;
	precision /= i;
	var stats = new table();
	stats.push(
	    { 'Precision': precision }
	  , { 'Recall': recall }
	);
	console.log(stats.toString());


	//console.log(sortable);

	// Precision
	/*for(var r = 0.1; r < 0.60; r+=0.01) {
		var precision = 0;
		var recall = 0;

		for(var i = 0; sortable[i][1] > r; i++) {
			var doc = sortable[i];

			for(var j = 0; j < queryExpectedResults[id].length; j++) {
				if(queryExpectedResults[id][j][0] == doc[0])
					precision++;
			}
		}

		recall = precision / queryExpectedResults[id].length;
		precision /= i;

		//console.log('Precision:', precision);
		//console.log('Recall:', recall);
		//console.log(Math.round(r*100)/100 + '\t' + Math.round(precision*100)/100 + '\t' + Math.round(recall*100)/100);
		var index = Math.round(r*100);
		precisions[index] += precision;
		recalls[index] += recall;
	}*/

	

	//console.log('Precision:', precision);
	//console.log('Recall:', recall);
	//console.log(Math.round(precision*100)/100 + '\t' + Math.round(recall*100)/100);
	

}

var precisions = [];
var recalls = [];

var queryExpectedResults = {};
function processQueryExpectedResults(data) {
	data = data.split('\n');

	for(var idx in data) {
		var queryRes = data[idx].split(' ');
		if (queryExpectedResults[queryRes[0]] == undefined)
			queryExpectedResults[queryRes[0]] = new Array();
		
		queryExpectedResults[queryRes[0]].push([queryRes[1], queryRes[2]]);
	}

	//console.log(queryExpectedResults);
}

// Read stopwords
// from: http://www.ranks.nl/stopwords
fs.readFile(stopwordsFile, { encoding: 'utf8', flag: 'r' }, function (err, data) {
	if (err) throw err;
	else stopwords = data.split('\n');

	// Read querie results file
	// from: http://ir.dcs.gla.ac.uk/resources/test_collections/cran/
	fs.readFile('./docs/cranqrel', { encoding: 'utf8', flag: 'r' }, function (err, data) {
		if (err) throw err;
		else processQueryExpectedResults(data);

		/*for(var r = 0.01; r < 0.60; r+=0.01)
		{
			var index = Math.round(r*100);
			precisions[index] = 0;
			recalls[index] = 0;
		}*/

		// Read queries file
		// from: http://ir.dcs.gla.ac.uk/resources/test_collections/cran/
		fs.readFile(queriesFile, { encoding: 'utf8', flag: 'r' }, function (err, data) {
			if (err) throw err;
			else processQueriesFile(data);

			//for(var r = 0.1; r < 0.60; r+=0.01)
			//	console.log(Math.round(r*100)/100  + '\t' + Math.round(precisions[Math.round(r*100)]*100)/100 + '\t' + Math.round(recalls[Math.round(r*100)]*100)/100);
			
		});
	});
});