/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { focus } from '@wordpress/dom';
import { useRef } from '@wordpress/element';
import { UP, DOWN, LEFT, RIGHT } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import RovingTabIndexContainer from '../roving-tab-index';

/**
 * Return focusables in a row element, excluding those from other branches
 * nested within the row.
 *
 * @param {Element} rowElement The DOM element representing the row.
 *
 * @return {?Array} The array of focusables in the row.
 */
function getRowFocusables( rowElement ) {
	const focusablesInRow = focus.focusable.find( rowElement );

	if ( ! focusablesInRow || ! focusablesInRow.length ) {
		return;
	}

	return focusablesInRow.filter( ( focusable ) => {
		return focusable.closest( '[role="treeitem"]' ) === rowElement;
	} );
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/navigable-tree-grid/README.md
 */
export default function TreeGrid( { children, ...props } ) {
	const containerRef = useRef();

	const onKeyDown = ( event ) => {
		const { keyCode } = event;

		if ( ! includes( [ UP, DOWN, LEFT, RIGHT ], keyCode ) ) {
			return;
		}

		event.stopPropagation();

		const { activeElement } = document;
		if ( ! containerRef.current.contains( activeElement ) ) {
			return;
		}

		// Calculate the columnIndex of the active element.
		const activeRow = activeElement.closest( '[role="treeitem"]' );
		const focusablesInRow = getRowFocusables( activeRow );
		const currentColumnIndex = focusablesInRow.indexOf( activeElement );

		if ( includes( [ LEFT, RIGHT ], keyCode ) ) {
			// Calculate to the next element.
			let nextIndex;
			if ( keyCode === LEFT ) {
				nextIndex = Math.max( 0, currentColumnIndex - 1 );
			} else {
				nextIndex = Math.min( currentColumnIndex + 1, focusablesInRow.length - 1 );
			}

			// Focus is either at the left or right edge of the grid. Do nothing.
			if ( nextIndex === currentColumnIndex ) {
				return;
			}

			// Focus the next element.
			focusablesInRow[ nextIndex ].focus();
		} else if ( includes( [ UP, DOWN ], keyCode ) ) {
			// Calculate the rowIndex of the next row.
			const rows = Array.from( containerRef.current.querySelectorAll( '[role="treeitem"]' ) );
			const currentRowIndex = rows.indexOf( activeRow );
			let nextRowIndex;

			if ( keyCode === UP ) {
				nextRowIndex = Math.max( 0, currentRowIndex - 1 );
			} else {
				nextRowIndex = Math.min( currentRowIndex + 1, rows.length - 1 );
			}

			// Focus is either at the top or bottom edge of the grid. Do nothing.
			if ( nextRowIndex === currentRowIndex ) {
				return;
			}

			// Get the focusables in the next row.
			const focusablesInNextRow = getRowFocusables( rows[ nextRowIndex ] );

			// If for some reason there are no focusables in the next row, do nothing.
			if ( ! focusablesInNextRow || ! focusablesInNextRow.length ) {
				return;
			}

			// Try to focus the element in the next row that's at a similar column to the activeElement.
			const nextIndex = Math.min( currentColumnIndex, focusablesInNextRow.length - 1 );
			focusablesInNextRow[ nextIndex ].focus();
		}
	};

	return (
		<RovingTabIndexContainer>
			{ /* Disable reason: A treegrid is implemented using a table element. */ }
			{ /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role */ }
			<table role="treegrid" onKeyDown={ onKeyDown } ref={ containerRef } { ...props }>
				{ children }
			</table>
		</RovingTabIndexContainer>
	);
}

export { default as TreeGridRow } from './row';
export { default as TreeGridCell } from './cell';
