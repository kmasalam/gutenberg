/**
 * External dependencies
 */
import classnames from 'classnames';
import { dropRight, get, map, times } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	RangeControl,
} from '@wordpress/components';
import {
	InspectorControls,
	InnerBlocks,
	BlockControls,
	__experimentalBlockPatternPicker,
	BlockVerticalAlignmentToolbar,
} from '@wordpress/block-editor';
import {
	withDispatch,
	useDispatch,
	useSelect,
} from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import { useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	hasExplicitColumnWidths,
	getMappedColumnWidths,
	getRedistributedColumnWidths,
	toWidthPrecision,
} from './utils';

/**
 * Allowed blocks constant is passed to InnerBlocks precisely as specified here.
 * The contents of the array should never change.
 * The array should contain the name of each block that is allowed.
 * In columns block, the only block we allow is 'core/column'.
 *
 * @constant
 * @type {string[]}
 */
const ALLOWED_BLOCKS = [ 'core/column' ];

function ColumnsEditContainer( {
	attributes,
	className,
	setAttributes,
	updateAlignment,
	updateColumns,
	clientId,
} ) {
	const { verticalAlignment } = attributes;
	const wrapperRef = useRef();

	const { count } = useSelect( ( select ) => {
		return {
			count: select( 'core/block-editor' ).getBlockCount( clientId ),
		};
	}, [ clientId ] );

	const classes = classnames( className, {
		[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	const { childColumnsAttributes } = useSelect( ( select ) => {
		const { getBlockOrder, getBlockAttributes } = select( 'core/block-editor' );
		const childColumns = getBlockOrder( clientId );

		return {

			childColumnsAttributes: childColumns.map( ( block ) => getBlockAttributes( block ) ),

		};
	}, [ clientId ] );

	let columnsTemplateString = ``;

	childColumnsAttributes.forEach( ( column ) => {
		if ( ! column.width || column.width < 0 ) {
			columnsTemplateString += `1fr `;
		} else {
			columnsTemplateString += `${ column.width }% `;
		}
	} );

	useEffect( () => {
		setAttributes( { columnsTemplate: columnsTemplateString } );
	}, [] );

	const wrapper = wrapperRef.current;
	if ( wrapper ) {
		const layoutWrapper = wrapper.querySelector( '.block-editor-block-list__layout' );
		layoutWrapper.style.setProperty( '--columns-template', columnsTemplateString );
	}

	return (
		<>
			<InspectorControls>
				<PanelBody>
					<RangeControl
						label={ __( 'Columns' ) }
						value={ count }
						onChange={ ( value ) => updateColumns( count, value ) }
						min={ 2 }
						max={ 6 }
					/>
				</PanelBody>
			</InspectorControls>
			<BlockControls>
				<BlockVerticalAlignmentToolbar
					onChange={ updateAlignment }
					value={ verticalAlignment }
				/>
			</BlockControls>
			<div ref={ wrapperRef } className={ classes }>
				<InnerBlocks
					templateLock="all"
					allowedBlocks={ ALLOWED_BLOCKS } />
			</div>
		</>
	);
}

const ColumnsEditContainerWrapper = withDispatch( ( dispatch, ownProps, registry ) => ( {
	/**
	 * Update all child Column blocks with a new vertical alignment setting
	 * based on whatever alignment is passed in. This allows change to parent
	 * to overide anything set on a individual column basis.
	 *
	 * @param {string} verticalAlignment the vertical alignment setting
	 */
	updateAlignment( verticalAlignment ) {
		const { clientId, setAttributes } = ownProps;
		const { updateBlockAttributes } = dispatch( 'core/block-editor' );
		const { getBlockOrder } = registry.select( 'core/block-editor' );

		// Update own alignment.
		setAttributes( { verticalAlignment } );

		// Update all child Column Blocks to match
		const innerBlockClientIds = getBlockOrder( clientId );
		innerBlockClientIds.forEach( ( innerBlockClientId ) => {
			updateBlockAttributes( innerBlockClientId, {
				verticalAlignment,
			} );
		} );
	},

	/**
	 * Updates the column count, including necessary revisions to child Column
	 * blocks to grant required or redistribute available space.
	 *
	 * @param {number} previousColumns Previous column count.
	 * @param {number} newColumns      New column count.
	 */
	updateColumns( previousColumns, newColumns ) {
		const { clientId } = ownProps;
		const { replaceInnerBlocks } = dispatch( 'core/block-editor' );
		const { getBlocks } = registry.select( 'core/block-editor' );

		let innerBlocks = getBlocks( clientId );
		const hasExplicitWidths = hasExplicitColumnWidths( innerBlocks );

		// Redistribute available width for existing inner blocks.
		const isAddingColumn = newColumns > previousColumns;

		if ( isAddingColumn && hasExplicitWidths ) {
			// If adding a new column, assign width to the new column equal to
			// as if it were `1 / columns` of the total available space.
			const newColumnWidth = toWidthPrecision( 100 / newColumns );

			// Redistribute in consideration of pending block insertion as
			// constraining the available working width.
			const widths = getRedistributedColumnWidths( innerBlocks, 100 - newColumnWidth );

			innerBlocks = [
				...getMappedColumnWidths( innerBlocks, widths ),
				...times( newColumns - previousColumns, () => {
					return createBlock( 'core/column', {
						width: newColumnWidth,
					} );
				} ),
			];
		} else if ( isAddingColumn ) {
			innerBlocks = [
				...innerBlocks,
				...times( newColumns - previousColumns, () => {
					return createBlock( 'core/column' );
				} ),
			];
		} else {
			// The removed column will be the last of the inner blocks.
			innerBlocks = dropRight( innerBlocks, previousColumns - newColumns );

			if ( hasExplicitWidths ) {
				// Redistribute as if block is already removed.
				const widths = getRedistributedColumnWidths( innerBlocks, 100 );

				innerBlocks = getMappedColumnWidths( innerBlocks, widths );
			}
		}

		replaceInnerBlocks( clientId, innerBlocks, false );
	},
} ) )( ColumnsEditContainer );

const createBlocksFromInnerBlocksTemplate = ( innerBlocksTemplate ) => {
	return map(
		innerBlocksTemplate,
		( [ name, attributes, innerBlocks = [] ] ) =>
			createBlock( name, attributes, createBlocksFromInnerBlocksTemplate( innerBlocks ) )
	);
};

const ColumnsEdit = ( props ) => {
	const { clientId, name } = props;
	const { blockType, defaultPattern, hasInnerBlocks, patterns } = useSelect( ( select ) => {
		const {
			__experimentalGetBlockPatterns,
			getBlockType,
			__experimentalGetDefaultBlockPattern,
		} = select( 'core/blocks' );

		return {
			blockType: getBlockType( name ),
			defaultPattern: __experimentalGetDefaultBlockPattern( name ),
			hasInnerBlocks: select( 'core/block-editor' ).getBlocks( clientId ).length > 0,
			patterns: __experimentalGetBlockPatterns( name ),
		};
	}, [ clientId, name ] );

	const { replaceInnerBlocks } = useDispatch( 'core/block-editor' );

	if ( hasInnerBlocks ) {
		return (
			<ColumnsEditContainerWrapper { ...props } />
		);
	}

	return (
		<__experimentalBlockPatternPicker
			icon={ get( blockType, [ 'icon', 'src' ] ) }
			label={ get( blockType, [ 'title' ] ) }
			patterns={ patterns }
			onSelect={ ( nextPattern = defaultPattern ) => {
				if ( nextPattern.attributes ) {
					props.setAttributes( nextPattern.attributes );
				}
				if ( nextPattern.innerBlocks ) {
					replaceInnerBlocks(
						props.clientId,
						createBlocksFromInnerBlocksTemplate( nextPattern.innerBlocks )
					);
				}
			} }
			allowSkip
		/> );
};

export default ColumnsEdit;
