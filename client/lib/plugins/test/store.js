/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { assert } from 'chai';

/**
 * Internal dependencies
 */
import actions from './fixtures/actions';
import multiSite from './fixtures/multi-site';
import plugins from './fixtures/plugins';
import site from './fixtures/site';
import updatePluginData from './fixtures/updated-plugin';
import Dispatcher from 'calypso/dispatcher';
import PluginsStore from 'calypso/lib/plugins/store';
import { useFakeTimers } from 'calypso/test-helpers/use-sinon';

jest.mock( 'calypso/lib/redux-bridge', () => require( './mocks/redux-bridge' ) );

// Helper to retrieve a particular plugin from flux while we're migrating to Redux.
const getSitePlugin = ( siteObject, pluginSlug ) =>
	PluginsStore.getSitePlugins( siteObject ).find( ( plugin ) => plugin.slug === pluginSlug );

describe( 'Plugins Store', () => {
	test( 'Store should be an object', () => {
		assert.isObject( PluginsStore );
	} );

	test( 'Store should have method emitChange', () => {
		assert.isFunction( PluginsStore.emitChange );
	} );

	describe( 'Fetch Plugins', () => {
		beforeEach( () => {
			Dispatcher.handleServerAction( actions.fetched );
		} );

		test( 'Should update the store on RECEIVE_PLUGINS', () => {
			assert.isNotNull( PluginsStore.getSitePlugins( site ) );
		} );

		describe( 'getPlugins method', () => {
			test( 'Store should have method getPlugins', () => {
				assert.isFunction( PluginsStore.getPlugins );
			} );

			test( 'should return an array of objects', () => {
				const Plugins = PluginsStore.getPlugins( site );
				assert.isArray( Plugins );
				assert.isObject( Plugins[ 0 ] );
			} );

			test( 'should return an object with attribute sites array', () => {
				const Plugins = PluginsStore.getPlugins( site );
				assert.isArray( Plugins[ 0 ].sites );
				assert.isObject( Plugins[ 0 ].sites[ 0 ] );
			} );

			test( 'should return active Plugins', () => {
				const Plugins = PluginsStore.getPlugins( site, 'active' );
				assert.isTrue( Plugins[ 0 ].active );
			} );

			test( 'should return inactive Plugins', () => {
				const Plugins = PluginsStore.getPlugins( site, 'inactive' );
				assert.isFalse( Plugins[ 0 ].active );
			} );

			test( 'should return needs update Plugins', () => {
				const Plugins = PluginsStore.getPlugins( site, 'updates' );
				assert.isObject( Plugins[ 0 ].update );
			} );

			test( 'should return all Plugin', () => {
				const Plugins = PluginsStore.getPlugins( site, 'all' );
				assert.equal( Plugins.length, plugins.length );
			} );

			test( 'should return none Plugin', () => {
				const Plugins = PluginsStore.getPlugins( site, 'none' );
				assert.equal( Plugins.length, 0 );
			} );
		} );

		describe( 'getSitePlugins method', () => {
			test( 'Store should have method getSitePlugins', () => {
				assert.isFunction( PluginsStore.getSitePlugins );
			} );

			test( 'Should have return Array of Objects', () => {
				const Plugins = PluginsStore.getSitePlugins( site );
				assert.isArray( Plugins );
				assert.isObject( Plugins[ 0 ] );
			} );

			test( "Should have return undefined if site doesn't exist", () => {
				assert.isUndefined(
					PluginsStore.getSitePlugins( {
						ID: 1,
						jetpack: false,
						plan: { product_slug: 'free_plan' },
					} )
				);
			} );
		} );

		describe( 'getSites method', () => {
			test( 'Store should have method getSites', () => {
				assert.isFunction( PluginsStore.getSites );
			} );

			test( 'Should return Array of Objects', () => {
				const Sites = PluginsStore.getSites( site, 'akismet' );
				assert.isArray( Sites );
				assert.isObject( Sites[ 0 ] );
			} );

			test( 'Should return Array of Objects that has the pluginSlug as a attribute', () => {
				const Sites = PluginsStore.getSites( site, 'akismet' );
				assert.isArray( Sites );
				assert.isObject( Sites[ 0 ] );
				assert.equal( Sites[ 0 ].plugin.slug, 'akismet' );
			} );
		} );

		test( 'Should return an empty array if RECEIVE_PLUGINS errors', () => {
			Dispatcher.handleServerAction( actions.fetchedError );
			const UpdatedStore = PluginsStore.getPlugins( {
				ID: 123,
				jetpack: false,
				plan: { product_slug: 'free_plan' },
			} );
			assert.lengthOf( UpdatedStore, 0 );
		} );
	} );

	describe( 'Fetch Plugins Again', () => {
		beforeAll( () => {
			Dispatcher.handleServerAction( actions.fetched );
		} );

		test( 'should contain the list of latest plugins', () => {
			const Plugins = PluginsStore.getSitePlugins( site );
			let PluginsAgain = [];

			assert.lengthOf( Plugins, 4 );

			// Lets check if we can update the plugin list to something new.
			Dispatcher.handleServerAction( actions.fetchedAgain );
			PluginsAgain = PluginsStore.getSitePlugins( site );
			assert.lengthOf( PluginsAgain, 2 );
		} );

		afterAll( () => {
			// Return things to the way they were.
			Dispatcher.handleServerAction( actions.fetched );
		} );
	} );

	describe( 'Fetch Plugins MultiSite', () => {
		beforeAll( () => {
			Dispatcher.handleServerAction( actions.fetchedMultiSite );
		} );

		test( 'should contain the list of latest plugins', () => {
			const Plugins = PluginsStore.getSitePlugins( multiSite );
			assert.lengthOf( Plugins, 3 );
		} );

		afterAll( () => {
			// Return things to the way they were.
			Dispatcher.handleServerAction( actions.fetched );
		} );
	} );

	describe( 'Remove Plugin', () => {
		let Plugins;

		beforeAll( () => {
			Dispatcher.handleServerAction( actions.fetched );
			Plugins = PluginsStore.getPlugins( [ site ] );
		} );

		test( 'it should remove the plugin from the sites list', () => {
			Dispatcher.handleServerAction( actions.removedPlugin );
			const PluginsAfterRemoval = PluginsStore.getPlugins( [ site ] );
			assert.equal( Plugins.length, PluginsAfterRemoval.length + 1 );
		} );

		test( 'it should bring the plugin back if there is an error while removing the plugin', () => {
			Dispatcher.handleViewAction( actions.removedPluginError );
			const PluginsAfterRemoval = PluginsStore.getPlugins( [ site ] );
			assert.equal( Plugins.length, PluginsAfterRemoval.length );
		} );
	} );

	describe( 'Update Plugin', () => {
		let HelloDolly;

		describe( 'Updating Plugin', () => {
			beforeEach( () => {
				Dispatcher.handleViewAction( actions.updatePlugin );
				HelloDolly = getSitePlugin( site, 'hello-dolly' );
			} );

			test( "doesn't remove update when lauched", () => {
				assert.isNotNull( HelloDolly.update );
			} );
		} );

		describe( 'Successfully Plugin Update', () => {
			// just eat the timer sets, we're not testing that part yet
			useFakeTimers();

			beforeEach( () => {
				Dispatcher.handleViewAction( actions.updatedPlugin );
				HelloDolly = getSitePlugin( site, 'hello-dolly' );
			} );

			test( 'should set lastUpdated', () => {
				assert.isNotNull( HelloDolly.update.lastUpdated );
			} );

			test( 'should update the plugin data', () => {
				assert.equal( HelloDolly.version, updatePluginData.version );
				assert.equal( HelloDolly.author, updatePluginData.author );
				assert.equal( HelloDolly.description, updatePluginData.description );
				assert.equal( HelloDolly.author_url, updatePluginData.author_url );
				assert.equal( HelloDolly.name, updatePluginData.name );
			} );
		} );

		describe( 'Remove Plugin Update Info', () => {
			beforeEach( () => {
				Dispatcher.handleViewAction( actions.clearPluginUpdate );
				HelloDolly = getSitePlugin( site, 'hello-dolly' );
			} );

			test( 'should remove lastUpdated', () => {
				assert.isNull( HelloDolly.update );
			} );
		} );

		describe( 'Failed Plugin Update', () => {
			beforeEach( () => {
				Dispatcher.handleViewAction( actions.updatedPluginError );
				HelloDolly = getSitePlugin( site, 'hello-dolly' );
			} );

			test( 'should set update to an object', () => {
				assert.isObject( HelloDolly.update );
			} );
		} );
	} );

	describe( 'Activate Plugin', () => {
		describe( 'Activaiting Plugin', () => {
			test( 'Should set active = true if plugin is being activated', () => {
				Dispatcher.handleViewAction( actions.activatePlugin );
				assert.isTrue( getSitePlugin( site, 'developer' ).active );
			} );
		} );

		describe( 'Succesfully Activated Plugin', () => {
			test( 'Should set active = true', () => {
				Dispatcher.handleViewAction( actions.activatedPlugin );
				assert.isTrue( getSitePlugin( site, 'developer' ).active );
			} );
		} );

		describe( 'Error while Activating Plugin', () => {
			test( 'Should set active = false', () => {
				Dispatcher.handleServerAction( actions.activatedPluginError );
				assert.isFalse( getSitePlugin( site, 'developer' ).active );
			} );
		} );

		describe( 'Error while Activating Plugin with activation_error', () => {
			test( 'Should set active = true if plugin is being activated with error plugin already active', () => {
				Dispatcher.handleServerAction( actions.activatedPluginErrorAlreadyActive );
				assert.isTrue( getSitePlugin( site, 'developer' ).active );
			} );
		} );

		describe( 'Error while Activating Broken Plugin', () => {
			test( 'Should set active = false', () => {
				Dispatcher.handleServerAction( actions.activatedBrokenPluginError );
				assert.isFalse( getSitePlugin( site, 'developer' ).active );
			} );
		} );
	} );

	describe( 'Deactivate Plugin', () => {
		describe( 'Deactivating Plugin', () => {
			test( 'Should set active = false if plugin is being activated', () => {
				Dispatcher.handleViewAction( actions.deactivatePlugin );
				assert.isFalse( getSitePlugin( site, 'developer' ).active );
			} );
		} );

		describe( 'Succesfully Deactivated Plugin', () => {
			test( 'Should set active = false', () => {
				Dispatcher.handleViewAction( actions.deactivatedPlugin );
				assert.isFalse( getSitePlugin( site, 'developer' ).active );
			} );
		} );

		describe( 'Error while Deactivating Plugin', () => {
			test( 'Should set active = true', () => {
				Dispatcher.handleServerAction( actions.deactivatedPluginError );
				assert.isTrue( getSitePlugin( site, 'developer' ).active );
			} );
		} );

		describe( 'Error while Deactivating Plugin with deactivation_error', () => {
			test( 'Should set active = false if plugin is being deactivated with error plugin already deactived', () => {
				Dispatcher.handleServerAction( actions.deactivatedPluginErrorAlreadyNotActive );
				assert.isFalse( getSitePlugin( site, 'developer' ).active );
			} );
		} );
	} );

	describe( 'Enable AutoUpdates for Plugin', () => {
		test( 'Should set autoupdate = true if autoupdates are being enabled', () => {
			Dispatcher.handleViewAction( actions.enableAutoupdatePlugin );
			assert.isTrue( getSitePlugin( site, 'developer' ).autoupdate );
		} );

		test( 'Should set autoupdate = true after autoupdates enabling was successfully', () => {
			Dispatcher.handleServerAction( actions.enabledAutoupdatePlugin );
			assert.isTrue( getSitePlugin( site, 'developer' ).autoupdate );
		} );

		test( 'Should set autoupdate = false after autoupdates enabling errored ', () => {
			Dispatcher.handleServerAction( actions.enabledAutoupdatePluginError );
			assert.isFalse( getSitePlugin( site, 'developer' ).autoupdate );
		} );
	} );

	describe( 'Disable AutoUpdated for Plugins', () => {
		test( 'Should set autoupdate = false if autoupdates are being disabled', () => {
			Dispatcher.handleViewAction( actions.disableAutoupdatePlugin );
			assert.isFalse( getSitePlugin( site, 'developer' ).autoupdate, false );
		} );

		test( 'Should set autoupdate = false after autoupdates disabling was successfully', () => {
			Dispatcher.handleServerAction( actions.disabledAutoupdatePlugin );
			assert.isFalse( getSitePlugin( site, 'developer' ).autoupdate, false );
		} );

		test( 'Should set autoupdate = true after autoupdates disabling errored ', () => {
			Dispatcher.handleServerAction( actions.disabledAutoupdatePluginError );
			assert.isTrue( getSitePlugin( site, 'developer' ).autoupdate, true );
		} );
	} );
} );
