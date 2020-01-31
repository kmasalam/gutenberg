/**
 * External dependencies
 */
import { map, compact } from 'lodash';

/**
 * Internal dependencies
 */
import TreeGrid from '../tree-grid';
import BlockNavigationRow from './row';
import BlockNavigationAppenderRow from './appender-row';

function BlockNavigationRows( props ) {
	const {
		blocks,
		selectBlock,
		selectedBlockClientId,
		showAppender,
		showBlockMovers,
		showNestedBlocks,
		parentBlockClientId,
		level = 0,
	} = props;

	const isTreeRoot = ! parentBlockClientId;
	const hasAppender = showAppender && blocks.length > 0 && ! isTreeRoot;
	const filteredBlocks = compact( blocks );

	return (
		<>
			{ map( filteredBlocks, ( block, index ) => {
				const { clientId, innerBlocks } = block;
				const hasNestedBlocks = showNestedBlocks && !! innerBlocks && !! innerBlocks.length;

				return (
					<>
						<BlockNavigationRow
							key={ clientId }
							block={ block }
							onClick={ () => selectBlock( clientId ) }
							isSelected={ selectedBlockClientId === clientId }
							level={ level }
							position={ index }
							siblingCount={ filteredBlocks.length }
							showBlockMovers={ showBlockMovers }
						/>
						{ hasNestedBlocks && (
							<BlockNavigationRows
								blocks={ innerBlocks }
								selectedBlockClientId={ selectedBlockClientId }
								selectBlock={ selectBlock }
								showAppender={ showAppender }
								showBlockMovers={ showBlockMovers }
								showNestedBlocks={ showNestedBlocks }
								parentBlockClientId={ clientId }
								level={ level + 1 }
							/>
						) }
					</>
				);
			} ) }
			{ hasAppender && <BlockNavigationAppenderRow parentBlockClientId={ parentBlockClientId } /> }
		</>
	);
}

/**
 * Wrap `BlockNavigationRows` with `TreeGrid`. BlockNavigationRows is a
 * recursive component (it renders itself), so this ensures TreeGrid is only
 * present at the very top of the navigation grid.
 *
 * @param {Object} props
 */
export default function BlockNavigationGrid( props ) {
	return (
		<TreeGrid className="block-editor-block-navigation-grid">
			<BlockNavigationRows { ...props } />
		</TreeGrid>
	);
}
