<?php
/**
 * Server-side rendering of the `core/post-author` block.
 *
 * @package WordPress
 */

 /**
 * Build an array with CSS classes and inline styles defining the colors
 * which will be applied to the navigation markup in the front-end.
 *
 * @param  array $attributes Navigation block attributes.
 * @return array Colors CSS classes and inline styles.
 */
function post_author_build_css_colors( $attributes ) {
	$colors = array(
		'css_classes'   => array(),
		'inline_styles' => '',
	);

	// Text color.
	$has_named_text_color  = array_key_exists( 'textColor', $attributes );
	$has_custom_text_color = array_key_exists( 'customTextColor', $attributes );

	// If has text color.
	if ( $has_custom_text_color || $has_named_text_color ) {
		// Add has-text-color class.
		$colors['css_classes'][] = 'has-text-color';
	}

	if ( $has_named_text_color ) {
		// Add the color class.
		$colors['css_classes'][] = sprintf( 'has-%s-color', $attributes['textColor'] );
	} elseif ( $has_custom_text_color ) {
		// Add the custom color inline style.
		$colors['inline_styles'] .= sprintf( 'color: %s;', $attributes['customTextColor'] );
	}

	// Background color.
	$has_named_background_color  = array_key_exists( 'backgroundColor', $attributes );
	$has_custom_background_color = array_key_exists( 'customBackgroundColor', $attributes );

	// If has background color.
	if ( $has_custom_background_color || $has_named_background_color ) {
		// Add has-background-color class.
		$colors['css_classes'][] = 'has-background-color';
	}

	if ( $has_named_background_color ) {
		// Add the background-color class.
		$colors['css_classes'][] = sprintf( 'has-%s-background-color', $attributes['backgroundColor'] );
	} elseif ( $has_custom_background_color ) {
		// Add the custom background-color inline style.
		$colors['inline_styles'] .= sprintf( 'background-color: %s;', $attributes['customBackgroundColor'] );
	}

	return $colors;
}

/**
 * Build an array with CSS classes and inline styles defining the font sizes
 * which will be applied to the navigation markup in the front-end.
 *
 * @param  array $attributes Navigation block attributes.
 * @return array Font size CSS classes and inline styles.
 */
function post_author_build_css_font_sizes( $attributes ) {
	// CSS classes.
	$font_sizes = array(
		'css_classes'   => array(),
		'inline_styles' => '',
	);

	$has_named_font_size  = array_key_exists( 'fontSize', $attributes );
	$has_custom_font_size = array_key_exists( 'customFontSize', $attributes );

	if ( $has_named_font_size ) {
		// Add the font size class.
		$font_sizes['css_classes'][] = sprintf( 'has-%s-font-size', $attributes['fontSize'] );
	} elseif ( $has_custom_font_size ) {
		// Add the custom font size inline style.
		$font_sizes['inline_styles'] = sprintf( 'font-size: %spx;', $attributes['customFontSize'] );
	}

	return $font_sizes;
}

/**
 * Renders the `core/post-author` block on the server.
 *
 * @return string Returns the filtered post author for the current post wrapped inside "h6" tags.
 */
function render_block_core_post_author( $attributes ) {
	$post = gutenberg_get_post_from_context();

	if ( ! $post ) {
		return '';
	}

	$avatar = get_avatar(
		$post->post_author,
		$attributes['avatarSize']
	);

	$has_first_or_last_name = ! empty( $attributes['firstName'] ) || ! empty( $attributes['lastName'] );

	$author_name = $attributes['name'];
	if ( $attributes['showDisplayName'] && $has_first_or_last_name ) {
		$author_name = $attributes['firstName'] . ' ' . $attributes['lastName'];
	}

	$byline = ! empty( $attributes['byline'] ) ? $attributes['byline'] : __( 'Written by:' );

	$colors     = post_author_build_css_colors( $attributes );
	$font_sizes = post_author_build_css_font_sizes( $attributes );
	$classes    = array_merge(
		$colors['css_classes'],
		$font_sizes['css_classes'],
		array( 'wp-block-post-author' ),
		isset( $attributes['className'] ) ? array( $attributes['className'] ) : array(),
		isset( $attributes['itemsJustification'] ) ? array( 'items-justified-' . $attributes['itemsJustification'] ) : array(),
		isset( $attributes['align'] ) ? array( 'align' . $attributes['align'] ) : array()
	);

	$class_attribute = sprintf( ' class="%s"', esc_attr( implode( ' ', $classes ) ) );
	$style_attribute = ( $colors['inline_styles'] || $font_sizes['inline_styles'] )
		? sprintf( ' style="%s"', esc_attr( $colors['inline_styles'] ) . esc_attr( $font_sizes['inline_styles'] ) )
		: '';

	return sprintf( '<div %1$s %2$s>', $class_attribute, $style_attribute ) .
		( $attributes['showByline'] ? '<p class="wp-block-post-author__byline">' . $byline . '</p>' : '' ) .
		( $attributes['showAvatar'] ? '<div class="wp-block-post-author__avatar">' . $avatar . '</div>' : '' ) .
		'<div class="wp-block-post-author__content">' .
			'<p class="wp-block-post-author__name">' . $author_name . '</p>' .
			( $attributes['showBio'] ? '<p class="wp-block-post-author__bio">' . $attributes['description'] . '</p>' : '' ) .
		'</div>' .
	'</div>';
}

/**
 * Registers the `core/post-author` block on the server.
 */
function register_block_core_post_author() {
	register_block_type(
		'core/post-author',
		array(
			'render_callback' => 'render_block_core_post_author',
		)
	);
}
add_action( 'init', 'register_block_core_post_author' );
