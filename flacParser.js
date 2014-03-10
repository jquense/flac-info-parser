var inherits = require('util').inherits
  , Tokenizr = require('stream-tokenizr')
  , VorbisStream = require('vorbis-parser')
  , binary = require('./binaryHelpers')
  , _ = require('lodash')
  , debug = require('debuglog')('flacparser');


module.exports = FlacParser;

inherits(FlacParser, Tokenizr);

function FlacParser(){
    if ( !(this instanceof FlacParser) ) 
        return new FlacParser();

    Tokenizr.call(this, { objectMode: true })

    this.isEqual(new Buffer('fLaC'), 'not a valid flac file')
        .loop(function(end){
            this.readBuffer(4, this.parseBlockHeader)
                .tap(this.parseBlock)
                .tap(function(tok){
                    if ( tok.header.isLast ) {
                        this.push({ type: 'bytesToFirstFrame', value: this.bytesRead })
                        end()
                    }
                })
                .flush()
        })

}

FlacParser.prototype.parseBlockHeader = function(buf, tokens){
    var flag = binary.getBit(buf, 0, 7)
        header = {
            isLast: flag,
            type:   BLOCK_TYPES[buf[0] ^ (flag  ? 128 : 0)], // clear last bit
            length: binary.readUInt24BE(buf, 1)
        }

    tokens.header = header
}

FlacParser.prototype.parseBlock = function(tok){
    var self = this
      , type = TYPES[tok.header.type]

    switch (type){
        case TYPES.STREAMINFO:

            self.readBuffer(tok.header.length, this.parseFlacProps )
                .tap(function(tokens){
                    _.each(tokens.properties, function(v, k){
                        self.push({ type: k, value: v })
                    })
                })
            break

        case TYPES.VORBIS_COMMENT:

            self.readBuffer(tok.header.length, this.parseVorbisComments )
                .tap(function(tokens){
                    _.each(tokens.comments, function(v, k){
                        self.push({ type: k, value: v })
                    })

                })
            break
        case TYPES.PICTURE:

            self.readBuffer(tok.header.length, function(buff){
                self.push({
                    type: 'picture',
                    value: VorbisStream.parsePicture(buff)
                })
            })
            break
        default:
            self.skip(tok.header.length)
            break
    }
}

FlacParser.prototype.parseFlacProps = function(buf, tokens){

    tokens.properties = {
        minBlockSize: buf.readUInt16BE(0 ),
        maxBlockSize: buf.readUInt16BE(2),
        minFrameSize: binary.readUInt24BE(buf, 4),
        maxFrameSize: binary.readUInt24BE(buf, 7),
        sampleRate: binary.readUInt24BE(buf, 10) >> 4,
        channels: ((buf[12] >> 1) & 0x7) + 1,
        bitsPerSample: ((buf.readUInt16BE(12) >> 4 ) & 0xF) + 1, //first 4 bits of byte 13
        samplesInStream: buf.readUInt32BE(14) //need to also add last 4 bytes of 13
    }

    tokens.properties.duration =  (tokens.properties.samplesInStream / tokens.properties.sampleRate )

    if ( ( buf[13] & 0xF ) !== 0 ) 
        debug('samplesInStream number is larger than 32bits, i\'m to lazy to do that math')
}

//i'd like to once again thank taglib for guidance on parsing these correctly...
FlacParser.prototype.parseVorbisComments = function(buf, tokens){
    var header = new Buffer([0x3, 0x76, 0x6f, 0x72, 0x62, 0x69, 0x73]) //0x3 + "vorbis"
      , vorbis = new VorbisStream({ framingBit: false })

    tokens.comments = {}

    vorbis
        .on('error', function(err){
            vorbis.chainable.clearQueue();
        })
        .on('data', function(comment){
            tokens.comments[comment.type] = comment.value;
        })

    vorbis.end( Buffer.concat([ header, buf ], 7 + buf.length) )
}

var BLOCK_TYPES = {
        0: 'STREAMINFO',
        1: 'PADDING',
        2: 'APPLICATION',
        3: 'SEEKTABLE',
        4: 'VORBIS_COMMENT',
        5: 'CUESHEET',
        6: 'PICTURE',
        127: 'invalid'
    }
  , TYPES = _.invert(BLOCK_TYPES)


