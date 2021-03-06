/**
 * Node dependencies
 */
const { exit, stdout } = require( 'process' );

/**
 * External dependencies
 */
const chalk = require( 'chalk' );
const { sync: spawn } = require( 'cross-spawn' );
const { sync: resolveBin } = require( 'resolve-bin' );
const { sync: dirGlob } = require( 'dir-glob' );
const { sync: readPkgUp } = require( 'read-pkg-up' );

/**
 * Internal dependencies
 */
const {
	fromConfigRoot,
	fromProjectRoot,
	getArgFromCLI,
	getFileArgsFromCLI,
	hasArgInCLI,
	hasPackageProp,
	hasProjectFile,
} = require( '../utils' );

// Check if the project has wp-prettier installed and if the project has a Prettier config
function checkPrettier() {
	try {
		const prettierResolvePath = require.resolve( 'prettier' );
		const prettierPackageJson = readPkgUp( { cwd: prettierResolvePath } );
		const prettierPackageName = prettierPackageJson.pkg.name;

		if (
			! [ 'wp-prettier', '@wordpress/prettier' ].includes(
				prettierPackageName
			)
		) {
			return {
				success: false,
				message:
					chalk.red(
						'Incompatible version of Prettier was found in your project\n'
					) +
					"You need to install the 'wp-prettier' package to get " +
					'code formatting compliant with the WordPress coding standards.\n\n',
			};
		}
	} catch {
		return {
			success: false,
			message:
				chalk.red(
					"The 'prettier' package was not found in your project\n"
				) +
				"You need to install the 'wp-prettier' package under an alias to get " +
				'code formatting compliant with the WordPress coding standards.\n\n',
		};
	}

	// See: https://prettier.io/docs/en/configuration.html
	const hasProjectPrettierConfig =
		hasProjectFile( '.prettierrc' ) ||
		hasProjectFile( '.prettierrc.json' ) ||
		hasProjectFile( '.prettierrc.yaml' ) ||
		hasProjectFile( '.prettierrc.yml' ) ||
		hasProjectFile( '.prettierrc.js' ) ||
		hasProjectFile( '.prettierrc.config.js' ) ||
		hasProjectFile( '.prettierrc.toml' ) ||
		hasPackageProp( 'prettier' );

	if ( ! hasProjectPrettierConfig ) {
		return {
			success: false,
			message:
				chalk.red(
					'The Prettier config file was not found in your project\n'
				) +
				'You need to create a top-level Prettier config file in your project to get ' +
				'automatic code formatting that works with IDE and editor integrations.\n\n',
		};
	}

	return { success: true };
}

const checkResult = checkPrettier();
if ( ! checkResult.success ) {
	stdout.write( checkResult.message );
	exit( 1 );
}

// If `--ignore-path` is not explicitly specified, use the project's or global .eslintignore
let ignorePath = getArgFromCLI( '--ignore-path' );
if ( ! ignorePath ) {
	if ( hasProjectFile( '.eslintignore' ) ) {
		ignorePath = fromProjectRoot( '.eslintignore' );
	} else {
		ignorePath = fromConfigRoot( '.eslintignore' );
	}
}
const ignoreArgs = [ '--ignore-path', ignorePath ];

// forward the --require-pragma option that formats only files that already have the @format
// pragma in the first docblock.
const pragmaArgs = hasArgInCLI( '--require-pragma' )
	? [ '--require-pragma' ]
	: [];

// Get the files and directories to format and convert them to globs
let fileArgs = getFileArgsFromCLI();
if ( fileArgs.length === 0 ) {
	fileArgs = [ '.' ];
}

// Converts `foo/bar` directory to `foo/bar/**/*.js`
const globArgs = dirGlob( fileArgs, { extensions: [ 'js' ] } );

const result = spawn(
	resolveBin( 'prettier' ),
	[ '--write', ...ignoreArgs, ...pragmaArgs, ...globArgs ],
	{ stdio: 'inherit' }
);

process.exit( result.status );
