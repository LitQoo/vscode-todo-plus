
/* IMPORT */

import * as _ from 'lodash';
import * as globby from 'globby';
import stringMatches from 'string-matches';
import Config from '../config';
import Consts from '../consts';
import File from './file';
import Folder from './folder';

/* EMBEDDED PROVIDER JS */

class EmbeddedProviderJS {

  filesData = undefined; // { [filePath]: todo[] | undefined }

  async getFilePaths ( rootPaths ) {

    const config = Config.get (),
          {include, exclude} = config.embedded;

    return _.flatten ( await Promise.all ( rootPaths.map ( cwd => globby ( include, { cwd, ignore: exclude, absolute: true } ) ) ) );

  }

  async initFilesData ( rootPaths ) {

    const filePaths = await this.getFilePaths ( rootPaths );

    this.filesData = {};

    await Promise.all ( filePaths.map ( async ( filePath: string ) => {

      this.filesData[filePath] = await this.getFileData ( filePath );

    }));

  }

  async updateFilesData () {

    if ( _.isEmpty ( this.filesData ) ) return;

    await Promise.all ( _.map ( this.filesData, async ( val, filePath ) => {

      if ( val ) return;

      this.filesData[filePath] = await this.getFileData ( filePath );

    }));

  }

  async getFileData ( filePath ) {

    const data = [],
          content = await File.read ( filePath );

    if ( !content ) return data;

    const lines = content.split ( /\r?\n/ );

    let parsedPath;

    lines.forEach ( ( rawLine, lineNr ) => {

      const line = _.trimStart ( rawLine ),
            matches = stringMatches ( line, Consts.regexes.todoEmbedded );

      if ( !matches.length ) return;

      if ( !parsedPath ) {

        parsedPath = Folder.parsePath ( filePath );

      }

      matches.forEach ( match => {

        data.push ({
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
        });

      });

    });

    return data;

  }

};

/* EXPORT */

export default EmbeddedProviderJS;
