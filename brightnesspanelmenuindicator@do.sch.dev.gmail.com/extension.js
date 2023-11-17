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

// Updated to GNOME Shell 45 by bergs89 (bergs89@gmail.com) & ChatGPT4

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Gio from 'gi://Gio';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';

const brightnessIconName = 'display-brightness-symbolic';

var brightnessIndicator = null;
var brightnessIndicatorMenu = null;
var brightnessSlider = null;
var brightnessIcon = null;

function icon_scrolled(actor, event) {
    let res = brightnessSlider.emit('scroll-event', event);

    if (res == Clutter.EVENT_PROPAGATE || brightnessIndicatorMenu.actor.mapped)
        return res;

    let gicon = new Gio.ThemedIcon({ name: brightnessIconName });
    let value = brightnessSlider.value;
    Main.osdWindowManager.show(-1, gicon, null, value);

    return res;
}

var BrightnessIndicator = GObject.registerClass(
    class BrightnessIndicator extends St.BoxLayout {
        _init() {
            super._init({
                style_class: 'panel-status-indicators-box',
                reactive: true,
                visible: true,
            });

            let icon = new St.Icon({
                style_class: 'system-status-icon',
                icon_name: brightnessIconName
            });
            this.add_actor(icon);

            this.visible = brightnessIndicator._item.visible;
            this._connectVisible();
        }

        _connectVisible() {
            this._visible_id = brightnessIndicator._item.connect(
                'notify::visible',
                (actor) => { this.visible = actor.visible; }
            );
        }

        disconnectVisible() {
            brightnessIndicator._item.disconnect(this._visible_id);
        }

        vfunc_scroll_event() {
            return icon_scrolled(this, Clutter.get_current_event());
        }
});

export default class MyBrightnessExtension {
    enable() {
        brightnessIndicator = Main.panel.statusArea.quickSettings._brightness;

        if (brightnessIndicator._item){
            brightnessSlider = brightnessIndicator._slider;
            brightnessIndicatorMenu = brightnessIndicator.menu;

            brightnessIcon = new BrightnessIndicator();
            Main.panel.statusArea.quickSettings._indicators.insert_child_at_index(brightnessIcon, 7);
        } else {
            brightnessIcon = brightnessIndicator._addIndicator();
            brightnessIcon.reactive = true;
            brightnessIcon.connect('scroll-event', icon_scrolled);
            brightnessIcon.icon_name = brightnessIconName;

            let quickSettingsItem = brightnessIndicator.quickSettingsItems.at(0);
            brightnessIndicatorMenu = quickSettingsItem.menu;
            brightnessSlider = quickSettingsItem.slider;
        }
    }

    disable() {
        if (brightnessIndicator._item){
            Main.panel.statusArea.quickSettings._indicators.remove_child(brightnessIcon);
            brightnessIcon.disconnectVisible();
        } else {
            brightnessIndicator.remove_actor(brightnessIcon);
        }

        brightnessSlider = null;
        brightnessIndicatorMenu = null;
        brightnessIndicator = null;
        brightnessIcon = null;
    }
}

