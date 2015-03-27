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

var util        = require('util');
var program     = require('commander');
var stemmer     = require('porter-stemmer').stemmer;
var parser      = require("./parser");
var tools       = require('./tools');

process.stdin.setEncoding('utf8');
// Configure application
program
	.version('1.0.3')
	.usage('[options] <queries>')
	.option('-b, --binary', 'use a binary query string (currently unused)')
	.option('-i, --index <file>', 'specify a custom JSON-formatted inverted index file')
	.option('-v, --verbose', 'enables verbose output')
	.parse(process.argv);

var indexFile = program.index || './docs/INV_FILE_HASH.json';
var invertedIdx = require(indexFile);


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

for(var index in queries) {
	var query = queries[index];

	if(program.verbose) {
		console.log('================= Query ' + (parseInt(index) + 1));
		console.log('Input: ' + query);
		console.log('Query Tree: ');
		console.log(util.inspect(parser(query), {depth: 10, colors: true}));

		console.log('\nResults: ');
	}

	console.log(JSON.stringify(binarySearch(parser(query))));
}

 