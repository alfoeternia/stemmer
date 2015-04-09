# Search engine
Use of Porter Stemmer in Javascript to implement a search engine over the Cranfield collection

## Installation

    $ npm install
  
## Usage

```  
 $ ./build.js --help

  Usage: build [options]

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    -j, --json               output JSON instead of a CLI formatted table
    -s, --sort               sort inverted index (default: no)
    -c, --collection <file>  specify a custom collection file
    -w, --stop-words <file>  specify a custom stopwords file
```
```  
 $ ./search.js --help
  Usage: search [options] <queries>

  Options:

    -h, --help          output usage information
    -V, --version       output the version number
    -b, --binary        use a binary query string (currently unused)
    -i, --index <file>  specify a custom JSON-formatted inverted index file
    -v, --verbose       enables verbose output
```

## Resources

* Porter Stemmer (in JS): https://github.com/jedp/porter-stemmer
* Cranfield collection: http://ir.dcs.gla.ac.uk/resources/test_collections/cran/
* Stopwords list: http://www.ranks.nl/stopwords
* JavaScript Expression Parser (JSEP): http://jsep.from.so/
