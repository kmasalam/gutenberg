/**
 * Internal dependencies
 */
import { TreeGridRow, TreeGridCell } from '../tree-grid';
import ButtonBlockAppender from '../button-block-appender';

export default function BlockNavigationAppenderRow( { parentBlockClientId } ) {
	return (
		<TreeGridRow className="block-editor-block-navigation-appender-row">
			<TreeGridCell>
				<ButtonBlockAppender
					rootClientId={ parentBlockClientId }
					__experimentalSelectBlockOnInsert={ false }
				/>
			</TreeGridCell>
		</TreeGridRow>
	);
}
