var chai = require('chai')
  , Parser = require('../flacParser');

chai.should()

describe('when parsing an Ogg Stream', function(){
    var parser, tags;

    beforeEach(function(){
        tags = {};
        parser = new Parser();
    })

    it('should push the correct objects', function(done){

        require('fs' ).createReadStream('./tests/test.flac')
            .pipe(parser)

        parser
            .on('data', function(t){
                tags[t.type] = t.value;
            })
            .on('finish', function(){

                tags.should.have.property('duration' ).that.is.closeTo(10, 0.1)
                tags.should.have.property('minBlockSize' ).that.equals(4608)
                tags.should.have.property('maxBlockSize' ).that.equals(4608)
                tags.should.have.property('md5sum' ).that.equals('e319cb440fc918fd04a1b2f406fbbc3a')

                tags.should.have.property('minFrameSize' ).that.equals(11)
                tags.should.have.property('maxFrameSize' ).that.equals(11)
                tags.should.have.property('samplesInStream' ).that.equals(443520)
                tags.should.have.property('bitsPerSample' ).that.equals(16)

                tags.should.have.property('Title' ).that.equals('test file')
                tags.should.have.property('Album' ).that.equals('a band called tang')
                tags.should.have.property('Artist' ).that.equals('jimmy')
                tags.should.have.property('Genre' ).that.equals('Acid')
                tags.should.have.property('Comment' ).that.equals('hellllloooo')
                tags.should.have.property('DATE' ).that.equals('2014')
                tags.should.have.property('TRACKNUMBER' ).that.equals('1')

                tags.should.have.property('picture' )
                tags.should.have.deep.property('picture.mime' ).that.equals('image/png')
                tags.should.have.deep.property('picture.desc' ).that.equals('xkcd.com')
                tags.should.have.deep.property('picture.data.length' ).that.equals(23867)
                done()
            })
    })

})


