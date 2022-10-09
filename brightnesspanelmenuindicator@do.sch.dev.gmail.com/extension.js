/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const Main = imports.ui.main;
const Gio = imports.gi.Gio;
const Clutter = imports.gi.Clutter;
const GObject = imports.gi.GObject;
const St = imports.gi.St;

const brightnessIconName = 'display-brightness-symbolic';

const quickSettings = Main.panel.statusArea.quickSettings
	? Main.panel.statusArea.quickSettings
	: Main.panel.statusArea.aggregateMenu;

var brightnessIndicator = null;
var brightnessIndicatorMenu = null;
var brightnessSlider = null;
var brightnessIcon = null;


function icon_scrolled(actor, event) {
	// pass event to slider
	let res = brightnessSlider.emit('scroll-event', event);

	// return if slider is visible or event is propagated
	if (res == Clutter.EVENT_PROPAGATE || brightnessIndicatorMenu.actor.mapped)
		return res;

	// show OSD
	let gicon = new Gio.ThemedIcon({ name: brightnessIconName });
	let value = brightnessSlider.value;
	Main.osdWindowManager.show(-1, gicon, null, value);

	return res;
}


class Indicator extends St.BoxLayout {
	_init() {
		super._init({
			style_class: 'panel-status-indicators-box',
			reactive: true,
			visible: true,
		});

		// create and add icon
		let icon = new St.Icon({
			style_class: 'system-status-icon',
			icon_name: brightnessIconName
		});
		this.add_actor(icon);

		this.visible = brightnessIndicator._item.visible;
		this._connectVisible();

	}

	_connectVisible() {
		// Hide and show icon together with the slider
		this._visible_id = brightnessIndicator._item.connect(
			'notify::visible',
			(function(actor) { this.visible = actor.visible; }).bind(this)
		);
	}

	disconnectVisible() {
		// disconnect signal
		brightnessIndicator._item.disconnect(this._visible_id);
	}

	vfunc_scroll_event() {
		return icon_scrolled(this, Clutter.get_current_event());
	}
}


function enable() {
	// get brightness
	brightnessIndicator = quickSettings._brightness;

	// Until Gnome 42, _brightness was not derived from Indicator
	if (brightnessIndicator._item){
		// get Slider and Menu
		brightnessSlider = brightnessIndicator._slider;
		brightnessIndicatorMenu = brightnessIndicator.menu;

		// create Indicator
		var Indicator = GObject.registerClass(Indicator);
		brightnessIcon = new Indicator();

		// insert indicator
		quickSettings._indicators.insert_child_at_index(brightnessIcon, 7);
	} else {
		// add Icon
		brightnessIcon = brightnessIndicator._addIndicator();
		brightnessIcon.reactive = true;
		brightnessIcon.connect('scroll-event', icon_scrolled);
		brightnessIcon.icon_name = brightnessIconName;

		// The brightnessIndicator wanted in callback is within quickSettingsItems
		let quickSettingsItem = brightnessIndicator.quickSettingsItems.at(0);
		brightnessIndicatorMenu = quickSettingsItem.menu;
		// get Slider
		brightnessSlider = quickSettingsItem.slider;
	}
}


function disable() {
	if (brightnessIndicator._item){
		// remove icon
		quickSettings._indicators.remove_child(brightnessIcon);

		// disconnect
		brightnessIcon.disconnectVisible();
	} else {
		// undo _addIndicator
		brightnessIndicator.remove_actor(brightnessIcon);
	}

	// cleanup
	brightnessSlider = null;
	brightnessIndicatorMenu = null;
	brightnessIndicator = null;
	brightnessIcon = null;
}
