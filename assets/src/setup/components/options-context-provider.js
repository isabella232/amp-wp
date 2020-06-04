/**
 * WordPress dependencies
 */
import { createContext, useEffect, useState, useRef, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';

export const Options = createContext();

/**
 * Context provider for options retrieval and updating.
 *
 * @param {Object} props Component props.
 * @param {?any} props.children Component children.
 * @param {string} props.optionsKey The key of the option to use from the settings endpoint.
 * @param {string} props.optionsRestEndpoint REST endpoint to retrieve options.
 */
export function OptionsContextProvider( { children, optionsKey, optionsRestEndpoint } ) {
	const [ options, setOptions ] = useState( null );
	const [ fetchingOptions, setFetchingOptions ] = useState( false );
	const [ fetchOptionsError, setFetchOptionsError ] = useState( null );
	const [ savingOptions, setSavingOptions ] = useState( false );
	const [ saveOptionsError, setSaveOptionsError ] = useState( null );
	const [ hasChanges, setHasChanges ] = useState( false );
	const [ hasSaved, setHasSaved ] = useState( false );

	// This component sets state inside async functions. Use this ref to prevent state updates after unmount.
	const hasUnmounted = useRef( false );

	/**
	 * Sends options to the REST endpoint to be saved.
	 *
	 * @param {Object} data Plugin options to update.
	 */
	const saveOptions = useCallback( async () => {
		setSavingOptions( true );

		try {
			await apiFetch( { method: 'post', url: optionsRestEndpoint, data: { [ optionsKey ]: options } } );

			if ( true === hasUnmounted.current ) {
				return;
			}
		} catch ( e ) {
			if ( true === hasUnmounted.current ) {
				return;
			}

			setSaveOptionsError( e );
		}

		setSavingOptions( false );
		setHasSaved( true );
	}, [ options, optionsKey, optionsRestEndpoint ] );

	/**
	 * Updates options in state.
	 *
	 * @param {Object} Updated options values.
	 */
	const updateOptions = useCallback( ( newOptions ) => {
		if ( false === hasChanges ) {
			setHasChanges( true );
		}

		setOptions( { ...options, ...newOptions } );
	}, [ hasChanges, options, setHasChanges, setOptions ] );

	useEffect( () => {
		/**
		 * Fetches plugin options from the REST endpoint.
		 */
		const fetchOptions = async () => {
			setFetchingOptions( true );

			try {
				const fetchedOptions = await apiFetch( { url: optionsRestEndpoint } );

				if ( true === hasUnmounted.current ) {
					return;
				}

				if ( ! ( optionsKey in fetchedOptions ) || ! fetchedOptions[ optionsKey ] ) { // The option is null if it doesn't pass schema validation.
					throw new Error( __( 'There was an error fetching options from the AMP plugin. ', 'amp' ) );
				}

				setOptions( fetchedOptions[ optionsKey ] );
			} catch ( e ) {
				if ( true === hasUnmounted.current ) {
					return;
				}

				setFetchOptionsError( e );
			}

			setFetchingOptions( false );
		};
		if ( ! options && ! fetchingOptions && ! fetchOptionsError ) {
			fetchOptions();
		}
	}, [ fetchingOptions, options, optionsKey, optionsRestEndpoint, fetchOptionsError ] );

	useEffect( () => () => {
		hasUnmounted.current = true;
	}, [] );

	return (
		<Options.Provider
			value={
				{
					fetchingOptions,
					fetchOptionsError,
					hasChanges,
					hasSaved,
					options,
					saveOptions,
					saveOptionsError,
					savingOptions,
					updateOptions,
				}
			}
		>
			{ children }
		</Options.Provider>
	);
}

OptionsContextProvider.propTypes = {
	children: PropTypes.any,
	optionsKey: PropTypes.string.isRequired,
	optionsRestEndpoint: PropTypes.string.isRequired,
};
