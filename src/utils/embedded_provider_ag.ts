
/* IMPORT */

import * as _ from 'lodash';
import * as execa from 'execa';
import stringMatches from 'string-matches';
import Consts from '../consts';
import Ackmate from './ackmate';
import Folder from './folder';

/* EMBEDDED PROVIDER AG */

// AG = The Silver Searcher //URL: https://github.com/ggreer/the_silver_searcher

class EmbeddedProviderAG {

  static bin = 'ag';

  filesData = undefined; // { [filePath]: todo[] | undefined }

  execa ( filePaths ) {

    return execa ( EmbeddedProviderAG.bin, ['--ackmate', '--nobreak', '--nocolor', '--ignore-case', '--print-long-lines', '--silent', Consts.regexes.todoEmbedded.source, ...filePaths] );

  }

  async getAckmate ( filePaths ) {

    filePaths = _.castArray ( filePaths );

    if ( !filePaths.length ) return [];

    try {

      const {stdout} = await this.execa ( filePaths );

      return Ackmate.parse ( stdout );

    } catch ( e ) {

      console.log ( e );

      return [];

    }

  }

  ackmate2data ( ackmate ) {

    ackmate.forEach ( ({ filePath, line: rawLine, lineNr }) => {

      const line = _.trimStart ( rawLine ),
            matches = stringMatches ( line, Consts.regexes.todoEmbedded )

      if ( !matches.length ) return;

      const parsedPath = Folder.parsePath ( filePath );

      matches.forEach ( match => {

        const data = {
          todo: match[0],
          type: match[1].toUpperCase (),
          message: match[2],
          code: line.slice ( 0, line.indexOf ( match[0] ) ),
          rawLine,
          line,
          lineNr,
          filePath,
          root: parsedPath.root,
          rootPath: parsedPath.rootPath,
          relativePath: parsedPath.relativePath
        };

        if ( !this.filesData[filePath] ) this.filesData[filePath] = [];

        this.filesData[filePath].push ( data );

      });

    });

  }

  async initFilesData ( rootPaths ) {

    const ackmate = await this.getAckmate ( rootPaths );

    this.filesData = {};

    this.ackmate2data ( ackmate );

  }

  async updateFilesData () {

    const filePaths = Object.keys ( this.filesData ).filter ( filePath => !this.filesData[filePath] ),
          ackmate = await this.getAckmate ( filePaths );

    this.ackmate2data ( ackmate );

  }

}

/* EXPORT */

export default EmbeddedProviderAG;
