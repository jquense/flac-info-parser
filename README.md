FLAC Audio File Metadata parser
=====================================

A simple streaming parser for retrieving  metadata from an .flac file.

### Install

    npm install flac-parser

### Use
The parser is simply a stream in objectMode, so you can pipe and binary data into it and it will spit out tag objects.

    var FLAC = require('flac-parser')
      , stream = require('fs').createReadStream('./my-file.flac')

    var parser = stream.pipe(new FLAC());

    parser.on('data', function(tag){
        console.log(tag.type)  // => 'samplesInStream'
        console.log(tag.value) // => 443520
    })

### Tags

In addition to the normal [vorbis comments audio tags](http://xiph.org/vorbis/doc/v-comment.html) metadata the flac parser exposes additional
flace info, from the STREAM_INFO block of the file

- `duration`
- `minBlockSize`
- `maxBlockSize`
- `minFrameSize`
- `maxFrameSize`
- `channels`
- `bitsPerSample`
- `samplesInStream`

consult the [vorbis parser](https://github.com/theporchrat/vorbis-info-parser) (used internally for comments)
documentation for more information