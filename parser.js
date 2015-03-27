#!/usr/bin/env node
/*
 * Implementation of a binary expression parser.
 *
 * The main idea of the parser is based on JSEP parser.
 * However, the main difference is that JSEP processes the 
 * query character by character, while I am rather processing
 * it on every group of the query: a group is an identifier,
 * an operator, or a parentheses.
 * @see http://jsep.from.so/
 *
 * @author Alexis Fouche
 * @repository https://github.com/alfoeternia/stemmer
 * @version 1.0.3
 */

 'use strict';



/*
 * Represents the available operators.
 * The value attributed to each operator represents
 * the precedence.
 *
 * @see http://en.wikipedia.org/wiki/Order_of_operations#Programming_language
 */
var binaryOperators = { 'OR': 1, 'AND': 2 };

/*
 * Utility function to handle errors
 *
 * @param message
 * @param index
 */
function throwError(message, index) {
 	console.error('Error: ' + message + ' at index ' + index);
}

/*
 * Returns binary precedence
 *
 * @param op The operator (AND, OR)
 */
function binaryPrecedence(op) {
 	return binaryOperators[op] || 0;
}

/*
 * Creates a Binary Expression structure.
 * According to purists, it should be called a logical expression.
 *
 * @param op The operator (AND, OR)
 * @param left Left node
 * @param right Right node
 */
function createBinaryExpression(op, left, right) {
 	return {
 		type: 'BinaryExpression',
 		op: op,
 		left: left,
 		right: right
 	};
}

/*
 * Uses a regular expression to check if the input
 * string is an identifier (lowercase word)
 *
 * @param s The string to analyze
 */
function isIdentifier (s) {
 	return /^[a-z]+$/.test(s);
}


/*
 * Parses the query by spliting at every spaces.
 * Then, each "term" is analyzed to determine whether it is
 * an operator, an identifier, or a sub-query (delimited with
 * parentheses).
 *
 * @param query The query as a string
 * @return a tree composed of every node representing the query.
 *
 * Example:
 *
 * { type: 'BinaryExpression',
 *  op: 'OR',
 *  left: 
 *   { type: 'BinaryExpression',
 *     op: 'AND',
 *     left: { type: 'Identifier', name: 'hello' },
 *     right: { type: 'Identifier', name: 'world' } },
 *  right: 
 *   { type: 'BinaryExpression',
 *     op: 'AND',
 *     left: 
 *      { type: 'UnaryExpression',
 *        op: 'NOT',
 *        arg: { type: 'Identifier', name: 'good' } },
 *     right: { type: 'Identifier', name: 'morning' } } }
 */
var parse = function (query) {

	// The expression is represented by the query splited on every spaces
	var expr = query.split(' ');
	var index = 0;

	/*
	 * Search for an operator is found
	 * If the current string is an operator, then return it.
	 */
	 function gobbleBinaryOp() {
	 	var s = expr[index];
	 	if(s === 'OR' || s === 'AND') 
	 		index++;
	 	return s;
	 }

	/*
	 * This method gobbles an individual expression, which can
	 * be an identifier (`hello`), an unary (`NOT hello`) or a
	 * binary expression (`hello AND world`).
	 */
	function gobbleExpression() {
		var node, biop, prec, stack, biop_info, left, right, i;

		// First, try to get the leftmost token
		// Then, check to see if there's a binary operator operating on that leftmost token
		left = gobbleToken();
		biop = gobbleBinaryOp();

		// If there wasn't a binary operator, just return the leftmost node
		if(!biop) {
			return left;
		}

		// Otherwise, we need to start a stack to properly place the binary
		// operations in their precedence structure
		biop_info = { value: biop, prec: binaryPrecedence(biop)};

		right = gobbleToken();
		if(!right) {
			throwError("Expected right expression after " + biop, index);
		}
		stack = [left, biop_info, right];

		// Properly deal with precedence using [recursive descent]
		// @see http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm
		// this part is taken from JSEP sources.
		while((biop = gobbleBinaryOp())) {
			prec = binaryPrecedence(biop);

			if(prec === 0) {
				break;
			}
			biop_info = { value: biop, prec: prec };

			// Reduce: make a binary expression from the three topmost entries.
			while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
				right = stack.pop();
				biop = stack.pop().value;
				left = stack.pop();
				node = createBinaryExpression(biop, left, right);
				stack.push(node);
			}

			node = gobbleToken();
			if(!node) {
				throwError("Expected expression after " + biop, index);
			}
			stack.push(biop_info, node);
		}

		i = stack.length - 1;
		node = stack[i];
		while(i > 1) {
			node = createBinaryExpression(stack[i - 1].value, stack[i - 2], node); 
			i -= 2;
		}

		return node;
	}

	/*
	 * Gobbles a single part of an expression
	 */
	function gobbleToken() {
		var s = expr[index];

		if(isIdentifier(s)) return gobbleIdentifier();

		else if (s === '(') return gobbleGroup();

		else {
			if(s == 'NOT') {
				index++;
				return {
					type: 'UnaryExpression',
					op: 'NOT',
					arg: gobbleToken()
				};
			}

			throwError('Invalid Unary Operator', index);
		}
	}

	/*
	 * Gobbles an identifier
	 */
	function gobbleIdentifier() {
		var s = expr[index];

		if(isIdentifier(s)) index++;
		else throwError('Unexpected identifier', index);

		return { type: 'Identifier', name: s };
	}

	/*
	 * Parses the content within parentheses, and consume
	 * the closing parenthesis.
	 */
	function gobbleGroup() {
		index++;
		var node = gobbleExpression();

		if(expr[index] === ')') {
			index++;
			return node;
		} else throwError('Unclosed closing parenthesis', index);
	}


	return gobbleExpression();

}

module.exports = parse;