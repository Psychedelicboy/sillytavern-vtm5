import { saveSettingsDebounced, getRequestHeaders } from '../../../../script.js';
import { extension_settings } from '../../../extensions.js';

// Initialize VTM settings
extension_settings.vtm = extension_settings.vtm || {
    autoSave: true,
    showRollDetails: true,
    defaultDifficulty: 2,
    characterData: {}
};

const VTM_PLUGIN = {
    characterData: null,
    currentCharacterId: null,

    init() {
        console.log('Initializing VTM 5e Plugin...');
        this.loadCharacterData();
        this.createCharacterSheetModal();
        this.setupEventListeners();
        console.log('VTM 5e Plugin initialized');
    },

    loadCharacterData() {
        const characterId = this.getCurrentCharacterId();
        console.log('Loading character data for:', characterId);
        
        if (characterId) {
            this.currentCharacterId = characterId;
            // Ensure we have a proper data structure
            if (extension_settings.vtm.characterData && extension_settings.vtm.characterData[characterId]) {
                this.characterData = this.deepMerge(
                    this.getDefaultCharacterSheet(),
                    extension_settings.vtm.characterData[characterId]
                );
            } else {
                this.characterData = this.getDefaultCharacterSheet();
            }
        } else {
            console.warn('No character ID found, using default sheet');
            this.characterData = this.getDefaultCharacterSheet();
        }
        
        console.log('Loaded character data:', this.characterData);
    },

    // Deep merge utility to ensure all properties exist
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    },

    saveCharacterData() {
        if (this.currentCharacterId && this.characterData && extension_settings.vtm.autoSave) {
            if (!extension_settings.vtm.characterData) {
                extension_settings.vtm.characterData = {};
            }
            extension_settings.vtm.characterData[this.currentCharacterId] = this.characterData;
            saveSettingsDebounced();
            console.log('Character data saved for:', this.currentCharacterId);
        }
    },

    getCurrentCharacterId() {
        // Try multiple methods to get current character ID
        try {
            if (window.characterId) {
                return window.characterId;
            }
            
            const characterNameElement = $('#character_name');
            if (characterNameElement.length) {
                return characterNameElement.data('characterId') || characterNameElement.text() || 'default';
            }
            
            // Fallback: use the current chat's character
            const chat = $('#chat');
            if (chat.length) {
                return 'current_chat';
            }
            
            return 'default';
        } catch (error) {
            console.warn('Could not get character ID, using default:', error);
            return 'default';
        }
    },

    getDefaultCharacterSheet() {
        return {
            // Basic Info
            name: 'New Vampire',
            clan: '',
            generation: '13th',
            sire: '',
            concept: '',
            
            // Attributes with proper nested structure
            attributes: {
                physical: { 
                    strength: 1, 
                    dexterity: 1, 
                    stamina: 1 
                },
                social: { 
                    charisma: 1, 
                    manipulation: 1, 
                    composure: 1 
                },
                mental: { 
                    intelligence: 1, 
                    wits: 1, 
                    resolve: 1 
                }
            },
            
            // Skills with proper nested structure
            skills: {
                physical: {
                    athletics: 0, brawl: 0, drive: 0, firearms: 0, 
                    larceny: 0, melee: 0, stealth: 0, survival: 0
                },
                social: {
                    animalKen: 0, etiquette: 0, insight: 0, intimidation: 0,
                    leadership: 0, performance: 0, persuasion: 0, streetwise: 0, subterfuge: 0
                },
                mental: {
                    academics: 0, awareness: 0, finance: 0, investigation: 0,
                    medicine: 0, occult: 0, politics: 0, science: 0, technology: 0
                }
            },
            
            // Advantages
            disciplines: {},
            bloodPotency: 1,
            humanity: 7,
            willpower: 5,
            willpowerMax: 5,
            health: 3,
            healthMax: 3,
            healthStatus: ['healthy', 'healthy', 'healthy'],
            hunger: 2,
            
            // Background
            predatorType: '',
            ambition: '',
            desire: '',
            convictions: [],
            touchstones: [],
            
            // Ensure all required fields exist
            _initialized: true
        };
    },

    createCharacterSheetModal() {
        console.log('Creating character sheet modal...');
        
        // Remove existing modal if it exists
        $('#vtm_character_modal').remove();
        
        const modalHtml = `
        <div id="vtm_character_modal" class="modal" style="display: none;">
            <div class="modal-content vtm-character-sheet" style="max-width: 800px;">
                <span class="close">&times;</span>
                <h2>Vampire: The Masquerade Character Sheet</h2>
                
                <div class="vtm-tabs">
                    <div class="vtm-tab active" data-tab="core">Core</div>
                    <div class="vtm-tab" data-tab="skills">Skills & Disciplines</div>
                    <div class="vtm-tab" data-tab="advantages">Advantages</div>
                    <div class="vtm-tab" data-tab="background">Background</div>
                </div>
                
                <div id="vtm-core-tab" class="vtm-tab-content active">
                    <!-- Content will be rendered dynamically -->
                </div>
                
                <div id="vtm-skills-tab" class="vtm-tab-content">
                    <!-- Content will be rendered dynamically -->
                </div>
                
                <div id="vtm-advantages-tab" class="vtm-tab-content">
                    <!-- Content will be rendered dynamically -->
                </div>
                
                <div id="vtm-background-tab" class="vtm-tab-content">
                    <!-- Content will be rendered dynamically -->
                </div>
                
                <div style="margin-top: 20px; text-align: center;">
                    <button id="vtm_save_sheet" class="vtm-roll-button">Save Sheet</button>
                    <button id="vtm_quick_roll" class="vtm-roll-button">Quick Roll</button>
                </div>
            </div>
        </div>
        `;
        
        $('body').append(modalHtml);
        this.setupModalEvents();
        this.refreshSheet(); // Initial render
        console.log('Character sheet modal created');
    },

    renderCoreTab() {
        // Ensure attributes exist
        if (!this.characterData.attributes) {
            this.characterData.attributes = this.getDefaultCharacterSheet().attributes;
        }
        
        const attrs = this.characterData.attributes;
        return `
        <div class="vtm-grid">
            <div class="vtm-section">
                <h3>Basic Info</h3>
                <input type="text" id="vtm_name" placeholder="Character Name" value="${this.escapeHtml(this.characterData.name || '')}">
                <input type="text" id="vtm_clan" placeholder="Clan" value="${this.escapeHtml(this.characterData.clan || '')}">
                <input type="text" id="vtm_generation" placeholder="Generation" value="${this.escapeHtml(this.characterData.generation || '')}">
            </div>
            
            <div class="vtm-section">
                <h3>Physical Attributes</h3>
                ${this.renderAttribute('strength', attrs.physical?.strength || 1)}
                ${this.renderAttribute('dexterity', attrs.physical?.dexterity || 1)}
                ${this.renderAttribute('stamina', attrs.physical?.stamina || 1)}
            </div>
            
            <div class="vtm-section">
                <h3>Social Attributes</h3>
                ${this.renderAttribute('charisma', attrs.social?.charisma || 1)}
                ${this.renderAttribute('manipulation', attrs.social?.manipulation || 1)}
                ${this.renderAttribute('composure', attrs.social?.composure || 1)}
            </div>
            
            <div class="vtm-section">
                <h3>Mental Attributes</h3>
                ${this.renderAttribute('intelligence', attrs.mental?.intelligence || 1)}
                ${this.renderAttribute('wits', attrs.mental?.wits || 1)}
                ${this.renderAttribute('resolve', attrs.mental?.resolve || 1)}
            </div>
        </div>
        `;
    },

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    renderAttribute(name, value) {
        const safeValue = Math.max(1, Math.min(5, value || 1)); // Ensure value is between 1-5
        return `
        <div class="vtm-attribute">
            <span>${name.charAt(0).toUpperCase() + name.slice(1)}</span>
            <div class="vtm-dot-rating" data-attribute="${name}">
                ${Array.from({length: 5}, (_, i) => 
                    `<div class="vtm-dot ${i < safeValue ? 'filled' : ''}" data-value="${i + 1}"></div>`
                ).join('')}
            </div>
        </div>
        `;
    },

    renderSkillsTab() {
        return `
        <div class="vtm-section">
            <h3>Skills</h3>
            <p>Skills interface coming soon...</p>
            <p>Physical Skills: ${Object.keys(this.characterData.skills?.physical || {}).join(', ')}</p>
            <p>Social Skills: ${Object.keys(this.characterData.skills?.social || {}).join(', ')}</p>
            <p>Mental Skills: ${Object.keys(this.characterData.skills?.mental || {}).join(', ')}</p>
        </div>
        <div class="vtm-section">
            <h3>Disciplines</h3>
            <p>Disciplines interface coming soon...</p>
        </div>
        `;
    },

    renderAdvantagesTab() {
        const hunger = this.characterData.hunger || 0;
        const willpower = this.characterData.willpower || 0;
        const willpowerMax = this.characterData.willpowerMax || 5;
        const humanity = this.characterData.humanity || 7;
        const healthMax = this.characterData.healthMax || 3;
        const healthStatus = this.characterData.healthStatus || ['healthy', 'healthy', 'healthy'];
        
        return `
        <div class="vtm-grid">
            <div class="vtm-section">
                <h3>Resources</h3>
                <div class="vtm-resource">
                    <label>Hunger: ${hunger}</label>
                    <div class="vtm-dot-rating" data-resource="hunger">
                        ${Array.from({length: 5}, (_, i) => 
                            `<div class="vtm-dot ${i < hunger ? 'filled' : ''}" data-value="${i + 1}"></div>`
                        ).join('')}
                    </div>
                </div>
                
                <div class="vtm-resource">
                    <label>Willpower: ${willpower}/${willpowerMax}</label>
                    <div class="vtm-resource-track">
                        ${Array.from({length: willpowerMax}, (_, i) => 
                            `<div class="vtm-willpower-box ${i < willpower ? 'filled' : ''}"></div>`
                        ).join('')}
                    </div>
                </div>
                
                <div class="vtm-resource">
                    <label>Health</label>
                    <div class="vtm-resource-track">
                        ${Array.from({length: healthMax}, (_, i) => {
                            const status = healthStatus[i] || 'healthy';
                            return `<div class="vtm-health-box ${status}" title="${status}"></div>`;
                        }).join('')}
                    </div>
                </div>
            </div>
            
            <div class="vtm-section">
                <h3>Humanity: ${humanity}</h3>
                <div class="vtm-dot-rating" data-resource="humanity">
                    ${Array.from({length: 10}, (_, i) => 
                        `<div class="vtm-dot ${i < humanity ? 'filled' : ''}" data-value="${i + 1}"></div>`
                    ).join('')}
                </div>
                <p><small>Higher is better - represents your connection to humanity</small></p>
            </div>
        </div>
        `;
    },

    renderBackgroundTab() {
        return `
        <div class="vtm-section">
            <h3>Character Background</h3>
            <p>Background information interface coming soon...</p>
            <p>Predator Type: ${this.characterData.predatorType || 'Not set'}</p>
            <p>Ambition: ${this.characterData.ambition || 'Not set'}</p>
            <p>Desire: ${this.characterData.desire || 'Not set'}</p>
        </div>
        `;
    },

    setupModalEvents() {
        console.log('Setting up modal events...');
        
        // Close modal when X is clicked
        $('#vtm_character_modal .close').on('click', () => {
            $('#vtm_character_modal').hide();
        });
        
        // Close modal when clicking outside
        $(window).on('click', (e) => {
            if (e.target.id === 'vtm_character_modal') {
                $('#vtm_character_modal').hide();
            }
        });
        
        // Tab switching
        $('.vtm-tab').off('click').on('click', (e) => {
            const tab = $(e.target).data('tab');
            this.switchTab(tab);
        });
        
        // Save sheet
        $('#vtm_save_sheet').off('click').on('click', () => {
            this.saveSheetData();
            this.saveCharacterData();
            this.showNotification('Character sheet saved!');
        });
        
        // Quick roll
        $('#vtm_quick_roll').off('click').on('click', () => {
            this.showRollDialog();
        });
        
        // Dot rating clicks
        $(document).off('click', '.vtm-dot-rating .vtm-dot').on('click', '.vtm-dot-rating .vtm-dot', (e) => {
            const dot = $(e.target);
            const ratingContainer = dot.closest('.vtm-dot-rating');
            const value = parseInt(dot.data('value'));
            const attribute = ratingContainer.data('attribute');
            const resource = ratingContainer.data('resource');
            
            console.log('Dot clicked:', { attribute, resource, value });
            
            if (attribute) {
                this.updateAttribute(attribute, value);
            } else if (resource) {
                this.updateResource(resource, value);
            }
        });
        
        console.log('Modal events setup complete');
    },

    showNotification(message) {
        // Simple notification system
        const notification = $(`<div class="vtm-notification">${message}</div>`);
        $('body').append(notification);
        
        notification.css({
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#8b0000',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '5px',
            zIndex: 10000
        });
        
        setTimeout(() => {
            notification.fadeOut(() => notification.remove());
        }, 3000);
    },

    switchTab(tabName) {
        console.log('Switching to tab:', tabName);
        $('.vtm-tab').removeClass('active');
        $('.vtm-tab-content').removeClass('active');
        $(`.vtm-tab[data-tab="${tabName}"]`).addClass('active');
        $(`#vtm-${tabName}-tab`).addClass('active');
        this.refreshTab(tabName);
    },

    refreshTab(tabName) {
        const tabContent = $(`#vtm-${tabName}-tab`);
        if (tabContent.length) {
            tabContent.html(this[`render${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`]());
        }
    },

    refreshSheet() {
        console.log('Refreshing character sheet...');
        const activeTab = $('.vtm-tab.active').data('tab') || 'core';
        this.refreshTab(activeTab);
    },

    updateAttribute(attribute, value) {
        console.log('Updating attribute:', attribute, value);
        
        // Find which category the attribute belongs to
        const categories = ['physical', 'social', 'mental'];
        for (const category of categories) {
            if (this.characterData.attributes[category] && 
                this.characterData.attributes[category][attribute] !== undefined) {
                this.characterData.attributes[category][attribute] = value;
                console.log(`Updated ${category}.${attribute} to ${value}`);
                break;
            }
        }
        this.refreshSheet();
    },

    updateResource(resource, value) {
        console.log('Updating resource:', resource, value);
        this.characterData[resource] = value;
        this.refreshSheet();
    },

    saveSheetData() {
        console.log('Saving sheet data...');
        this.characterData.name = $('#vtm_name').val() || 'Unnamed Vampire';
        this.characterData.clan = $('#vtm_clan').val() || '';
        this.characterData.generation = $('#vtm_generation').val() || '13th';
        console.log('Sheet data saved:', this.characterData);
    },

    showRollDialog() {
        console.log('Showing roll dialog...');
        
        // Remove existing dialog
        $('#vtm_roll_dialog').remove();
        
        const rollDialog = `
        <div id="vtm_roll_dialog" class="modal" style="display: none;">
            <div class="modal-content" style="max-width: 500px;">
                <span class="close">&times;</span>
                <h3>VTM Dice Roll</h3>
                
                <div class="vtm-section">
                    <label>Dice Pool:</label>
                    <input type="number" id="vtm_dice_pool" value="3" min="1" max="20">
                </div>
                
                <div class="vtm-section">
                    <label>Difficulty:</label>
                    <select id="vtm_difficulty">
                        <option value="1">1 - Simple</option>
                        <option value="2" selected>2 - Standard</option>
                        <option value="3">3 - Challenging</option>
                        <option value="4">4 - Difficult</option>
                        <option value="5">5 - Extreme</option>
                    </select>
                </div>
                
                <div class="vtm-section">
                    <label>Use Willpower Reroll:</label>
                    <input type="checkbox" id="vtm_willpower_reroll">
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <button id="vtm_roll_now" class="vtm-roll-button">Roll Dice</button>
                </div>
            </div>
        </div>
        `;
        
        $('body').append(rollDialog);
        $('#vtm_roll_dialog').show();
        
        $('#vtm_roll_dialog .close').on('click', () => {
            $('#vtm_roll_dialog').remove();
        });
        
        $(window).on('click', (e) => {
            if (e.target.id === 'vtm_roll_dialog') {
                $('#vtm_roll_dialog').remove();
            }
        });
        
        $('#vtm_roll_now').off('click').on('click', () => {
            this.performRoll();
        });
        
        console.log('Roll dialog shown');
    },

    performRoll() {
        const pool = parseInt($('#vtm_dice_pool').val()) || 3;
        const difficulty = parseInt($('#vtm_difficulty').val()) || 2;
        const useWillpower = $('#vtm_willpower_reroll').is(':checked');
        const hunger = this.characterData.hunger || 0;
        
        console.log('Performing roll:', { pool, difficulty, useWillpower, hunger });
        
        const result = this.rollV5Dice(pool, difficulty, hunger, useWillpower);
        this.displayRollResult(result);
        
        if (useWillpower && this.characterData.willpower > 0) {
            this.characterData.willpower--;
            this.saveCharacterData();
        }
        
        $('#vtm_roll_dialog').remove();
    },

    rollV5Dice(pool, difficulty, hunger, useWillpower = false) {
        const hungerDice = Math.min(hunger, pool);
        const regularDice = pool - hungerDice;
        
        let results = {
            regular: [],
            hunger: [],
            successes: 0,
            criticals: 0,
            messyCritical: false,
            bestialFailure: false
        };
        
        // Roll regular dice
        for (let i = 0; i < regularDice; i++) {
            const roll = Math.floor(Math.random() * 10) + 1;
            results.regular.push(roll);
            if (roll >= 6) results.successes++;
            if (roll === 10) results.criticals++;
        }
        
        // Roll hunger dice
        for (let i = 0; i < hungerDice; i++) {
            const roll = Math.floor(Math.random() * 10) + 1;
            results.hunger.push(roll);
            if (roll >= 6) results.successes++;
            if (roll === 10) {
                results.criticals++;
                results.messyCritical = true;
            }
            if (roll === 1) results.bestialFailure = true;
        }
        
        // Handle criticals
        if (results.criticals >= 2) {
            results.successes += results.criticals; // Each pair adds 2 successes
        }
        
        // Determine outcome
        if (results.bestialFailure && results.successes < difficulty) {
            results.outcome = 'Bestial Failure';
        } else if (results.messyCritical && results.criticals >= 2) {
            results.outcome = 'Messy Critical';
        } else if (results.successes >= difficulty) {
            results.outcome = 'Success';
        } else {
            results.outcome = 'Failure';
        }
        
        results.difficulty = difficulty;
        results.pool = pool;
        results.hungerDice = hungerDice;
        
        return results;
    },

    displayRollResult(result) {
        let output = `🎲 **VTM Roll** (Pool: ${result.pool}, Difficulty: ${result.difficulty}, Hunger: ${result.hungerDice})\n\n`;
        
        output += `**Regular Dice:** `;
        result.regular.forEach(roll => {
            const dieClass = roll >= 6 ? 'success' : roll === 10 ? 'critical' : '';
            output += `<span class="vtm-dice regular ${dieClass}">${roll}</span>`;
        });
        
        output += `\n**Hunger Dice:** `;
        result.hunger.forEach(roll => {
            const dieClass = roll >= 6 ? 'success' : roll === 10 ? 'critical' : '';
            output += `<span class="vtm-dice hunger ${dieClass}">${roll}</span>`;
        });
        
        output += `\n\n**Successes:** ${result.successes} | **Result:** ${result.outcome}`;
        
        if (result.messyCritical) {
            output += `\n\n⚠️ **Messy Critical!** The Beast taints your success.`;
        }
        
        if (result.bestialFailure) {
            output += `\n\n💀 **Bestial Failure!** The Beast takes control.`;
        }
        
        // Send to chat
        this.sendToChat(output);
    },

    sendToChat(message) {
        try {
            // Try to use SillyTavern's system message function
            if (window.sendSystemMessage) {
                window.sendSystemMessage(message);
            } else {
                // Fallback: add to chat manually
                const chat = $('#chat');
                if (chat.length) {
                    chat.append(`<div class="system_message">${message}</div>`);
                    chat.scrollTop(chat[0].scrollHeight);
                } else {
                    console.log('VTM Roll Result:', message);
                }
            }
        } catch (error) {
            console.error('Error sending message to chat:', error);
            console.log('VTM Roll Result (fallback):', message);
        }
    },

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Open character sheet when VTM button is clicked
        $(document).on('click', '#vtm_sheet', () => {
            console.log('VTM sheet button clicked');
            this.loadCharacterData();
            $('#vtm_character_modal').show();
        });
        
        // Handle dice dropdown options
        $(document).on('click', '#vtm_dice_dropdown .list-group-item', (e) => {
            const action = $(e.target).data('value');
            console.log('Dice action selected:', action);
            this.handleDiceAction(action);
        });
        
        console.log('Event listeners setup complete');
    },

    handleDiceAction(action) {
        switch(action) {
            case 'skill_check':
                this.showSkillRollDialog();
                break;
            case 'rouse_check':
                this.performRouseCheck();
                break;
            case 'frenzy_check':
                this.performFrenzyCheck();
                break;
            case 'custom_pool':
                this.showRollDialog();
                break;
            default:
                console.log('Unknown dice action:', action);
        }
    },

    performRouseCheck() {
        const roll = Math.floor(Math.random() * 10) + 1;
        const success = roll >= 6;
        
        let output = `🩸 **Rouse Check**\n`;
        output += `Roll: ${roll} | ${success ? '**Success** - No Hunger gained' : '**Failure** - Hunger increases by 1'}`;
        
        if (!success && this.characterData.hunger < 5) {
            this.characterData.hunger++;
            this.saveCharacterData();
        }
        
        this.sendToChat(output);
    },

    performFrenzyCheck() {
        const composure = this.characterData.attributes?.social?.composure || 1;
        const resolve = this.characterData.attributes?.mental?.resolve || 1;
        const pool = composure + resolve;
        const hungerDice = Math.min(this.characterData.hunger || 0, pool);
        
        let output = `😡 **Frenzy Check**\n`;
        output += `Pool: Composure (${composure}) + Resolve (${resolve}) = ${pool}, Hunger Dice: ${hungerDice}\n`;
        
        const result = this.rollV5Dice(pool, 3, hungerDice, false);
        
        output += `\n**Result:** ${result.successes} successes vs Difficulty 3\n`;
        
        if (result.successes < 3) {
            output += `\n💥 **Frenzy!** The Beast takes control.`;
        } else {
            output += `\n✅ **Resisted!** You maintain control.`;
        }
        
        this.sendToChat(output);
    }
};

// Initialize plugin when document is ready
jQuery(() => {
    console.log('Document ready, initializing VTM plugin...');
    setTimeout(() => {
        VTM_PLUGIN.init();
    }, 1000); // Small delay to ensure everything is loaded
});

// Export for potential external use
window.VTM_PLUGIN = VTM_PLUGIN;

export default VTM_PLUGIN;