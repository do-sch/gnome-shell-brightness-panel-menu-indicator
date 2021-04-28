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

const aggregateMenu = Main.panel.statusArea.aggregateMenu;

var aggregatedBrightnessIndicator = null;
var brightnessIcon = null;


var Indicator = GObject.registerClass(
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
			icon_name: 'display-brightness-symbolic'
		});
		this.add_actor(icon);
		
		this.visible = aggregatedBrightnessIndicator._item.visible;
		this._connectVisible();

	}
	
	_connectVisible() {
		// Hide and show icon together with the slider
		this._visible_id = aggregatedBrightnessIndicator._item.connect('notify::visible', (function(actor) {
			this.visible = actor.visible;
		}).bind(this));
	}
	
	disconnectVisible() {
		// disconnect signal
		aggregatedBrightnessIndicator._item.disconnect(this._visible_id);
	}

	vfunc_scroll_event() {
		// pass event to slider
		let result = aggregatedBrightnessIndicator._slider.emit('scroll-event', Clutter.get_current_event());
		
		// return if slider is visible or event is propagated
		if (result == Clutter.EVENT_PROPAGATE || aggregatedBrightnessIndicator.menu.actor.mapped)
			return result;
		
		// show OSD
		let gicon = new Gio.ThemedIcon({ name: 'display-brightness-symbolic' });
		let value = aggregatedBrightnessIndicator._slider.value;
		Main.osdWindowManager.show(-1, gicon, null, value);
		
		return result;
	}
});


function enable() {
	// get brightness
	aggregatedBrightnessIndicator = aggregateMenu._brightness;
	
	// create indicator
	brightnessIcon = new Indicator();
	
	// insert indicator
	aggregateMenu._indicators.insert_child_at_index(brightnessIcon, 7);
	
}

function disable() {
	// remove icon
	aggregateMenu._indicators.remove_child(brightnessIcon);
	
	// disconnect
	brightnessIcon.disconnectVisible();
	
	// destroy Objects
	aggregatedBrightnessIndicator = null;
	brightnessIcon = null;
}
