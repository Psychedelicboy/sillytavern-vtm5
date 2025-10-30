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
    characterData: {},
    currentCharacterId: null,

    init() {
        this.loadCharacterData();
        this.createCharacterSheetModal();
        this.setupEventListeners();
        console.log('VTM 5e Plugin initialized');
    },

    loadCharacterData() {
        const characterId = this.getCurrentCharacterId();
        if (characterId) {
            this.currentCharacterId = characterId;
            this.characterData = extension_settings.vtm.characterData[characterId] || this.getDefaultCharacterSheet();
        }
    },

    saveCharacterData() {
        if (this.currentCharacterId && extension_settings.vtm.autoSave) {
            extension_settings.vtm.characterData[this.currentCharacterId] = this.characterData;
            saveSettingsDebounced();
        }
    },

    getCurrentCharacterId() {
        // Get current character ID from SillyTavern
        return window.characterId || $('#character_name').data('characterId');
    },

    getDefaultCharacterSheet() {
        return {
            // Basic Info
            name: '',
            clan: '',
            generation: '',
            sire: '',
            concept: '',
            
            // Attributes
            attributes: {
                physical: { strength: 1, dexterity: 1, stamina: 1 },
                social: { charisma: 1, manipulation: 1, composure: 1 },
                mental: { intelligence: 1, wits: 1, resolve: 1 }
            },
            
            // Skills
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
            touchstones: []
        };
    },

    createCharacterSheetModal() {
        const modalHtml = `
        <div id="vtm_character_modal" class="modal">
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
                    ${this.renderCoreTab()}
                </div>
                
                <div id="vtm-skills-tab" class="vtm-tab-content">
                    ${this.renderSkillsTab()}
                </div>
                
                <div id="vtm-advantages-tab" class="vtm-tab-content">
                    ${this.renderAdvantagesTab()}
                </div>
                
                <div id="vtm-background-tab" class="vtm-tab-content">
                    ${this.renderBackgroundTab()}
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
    },

    renderCoreTab() {
        const attrs = this.characterData.attributes;
        return `
        <div class="vtm-grid">
            <div class="vtm-section">
                <h3>Basic Info</h3>
                <input type="text" id="vtm_name" placeholder="Character Name" value="${this.characterData.name || ''}">
                <input type="text" id="vtm_clan" placeholder="Clan" value="${this.characterData.clan || ''}">
                <input type="text" id="vtm_generation" placeholder="Generation" value="${this.characterData.generation || ''}">
            </div>
            
            <div class="vtm-section">
                <h3>Physical Attributes</h3>
                ${this.renderAttribute('strength', attrs.physical.strength)}
                ${this.renderAttribute('dexterity', attrs.physical.dexterity)}
                ${this.renderAttribute('stamina', attrs.physical.stamina)}
            </div>
            
            <div class="vtm-section">
                <h3>Social Attributes</h3>
                ${this.renderAttribute('charisma', attrs.social.charisma)}
                ${this.renderAttribute('manipulation', attrs.social.manipulation)}
                ${this.renderAttribute('composure', attrs.social.composure)}
            </div>
            
            <div class="vtm-section">
                <h3>Mental Attributes</h3>
                ${this.renderAttribute('intelligence', attrs.mental.intelligence)}
                ${this.renderAttribute('wits', attrs.mental.wits)}
                ${this.renderAttribute('resolve', attrs.mental.resolve)}
            </div>
        </div>
        `;
    },

    renderAttribute(name, value) {
        return `
        <div class="vtm-attribute">
            <span>${name.charAt(0).toUpperCase() + name.slice(1)}</span>
            <div class="vtm-dot-rating" data-attribute="${name}">
                ${Array.from({length: 5}, (_, i) => 
                    `<div class="vtm-dot ${i < value ? 'filled' : ''}" data-value="${i + 1}"></div>`
                ).join('')}
            </div>
        </div>
        `;
    },

    renderSkillsTab() {
        // Implementation for skills and disciplines
        return `<h3>Skills & Disciplines Content</h3>`;
    },

    renderAdvantagesTab() {
        return `
        <div class="vtm-grid">
            <div class="vtm-section">
                <h3>Resources</h3>
                <div class="vtm-resource">
                    <label>Hunger: ${this.characterData.hunger || 0}</label>
                    <div class="vtm-dot-rating" data-resource="hunger">
                        ${Array.from({length: 5}, (_, i) => 
                            `<div class="vtm-dot ${i < (this.characterData.hunger || 0) ? 'filled' : ''}" data-value="${i + 1}"></div>`
                        ).join('')}
                    </div>
                </div>
                
                <div class="vtm-resource">
                    <label>Willpower: ${this.characterData.willpower || 0}/${this.characterData.willpowerMax || 5}</label>
                    <div class="vtm-resource-track">
                        ${Array.from({length: (this.characterData.willpowerMax || 5)}, (_, i) => 
                            `<div class="vtm-willpower-box ${i < (this.characterData.willpower || 0) ? 'filled' : ''}"></div>`
                        ).join('')}
                    </div>
                </div>
                
                <div class="vtm-resource">
                    <label>Health</label>
                    <div class="vtm-resource-track">
                        ${Array.from({length: (this.characterData.healthMax || 3)}, (_, i) => {
                            const status = (this.characterData.healthStatus || [])[i] || 'healthy';
                            return `<div class="vtm-health-box ${status}"></div>`;
                        }).join('')}
                    </div>
                </div>
            </div>
            
            <div class="vtm-section">
                <h3>Humanity: ${this.characterData.humanity || 7}</h3>
                <div class="vtm-dot-rating" data-resource="humanity">
                    ${Array.from({length: 10}, (_, i) => 
                        `<div class="vtm-dot ${i < (this.characterData.humanity || 0) ? 'filled' : ''}" data-value="${i + 1}"></div>`
                    ).join('')}
                </div>
            </div>
        </div>
        `;
    },

    renderBackgroundTab() {
        return `<h3>Background Content</h3>`;
    },

    setupModalEvents() {
        $('#vtm_character_modal .close').on('click', () => {
            $('#vtm_character_modal').hide();
        });
        
        $('.vtm-tab').on('click', (e) => {
            const tab = $(e.target).data('tab');
            this.switchTab(tab);
        });
        
        $('#vtm_save_sheet').on('click', () => {
            this.saveSheetData();
            this.saveCharacterData();
        });
        
        $('#vtm_quick_roll').on('click', () => {
            this.showRollDialog();
        });
        
        // Dot rating clicks
        $(document).on('click', '.vtm-dot-rating .vtm-dot', (e) => {
            const dot = $(e.target);
            const ratingContainer = dot.closest('.vtm-dot-rating');
            const value = dot.data('value');
            const attribute = ratingContainer.data('attribute');
            const resource = ratingContainer.data('resource');
            
            if (attribute) {
                this.updateAttribute(attribute, value);
            } else if (resource) {
                this.updateResource(resource, value);
            }
        });
    },

    switchTab(tabName) {
        $('.vtm-tab').removeClass('active');
        $('.vtm-tab-content').removeClass('active');
        $(`.vtm-tab[data-tab="${tabName}"]`).addClass('active');
        $(`#vtm-${tabName}-tab`).addClass('active');
    },

    updateAttribute(attribute, value) {
        // Find which category the attribute belongs to
        const categories = ['physical', 'social', 'mental'];
        for (const category of categories) {
            if (this.characterData.attributes[category][attribute] !== undefined) {
                this.characterData.attributes[category][attribute] = value;
                break;
            }
        }
        this.refreshSheet();
    },

    updateResource(resource, value) {
        this.characterData[resource] = value;
        this.refreshSheet();
    },

    refreshSheet() {
        // Re-render the current tab
        const activeTab = $('.vtm-tab.active').data('tab');
        $(`#vtm-${activeTab}-tab`).html(this[`render${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}Tab`]());
    },

    saveSheetData() {
        this.characterData.name = $('#vtm_name').val();
        this.characterData.clan = $('#vtm_clan').val();
        this.characterData.generation = $('#vtm_generation').val();
        // Save other fields as needed
    },

    showRollDialog() {
        const rollDialog = `
        <div id="vtm_roll_dialog" class="modal">
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
        
        $('#vtm_roll_now').on('click', () => {
            this.performRoll();
        });
    },

    performRoll() {
        const pool = parseInt($('#vtm_dice_pool').val()) || 3;
        const difficulty = parseInt($('#vtm_difficulty').val()) || 2;
        const useWillpower = $('#vtm_willpower_reroll').is(':checked');
        const hunger = this.characterData.hunger || 0;
        
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
                if (roll === 10) results.messyCritical = true;
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
        // Implementation to send message to SillyTavern chat
        if (window.sendSystemMessage) {
            window.sendSystemMessage(message);
        } else {
            // Fallback: add to chat manually
            const chat = $('#chat');
            chat.append(`<div class="system_message">${message}</div>`);
            chat.scrollTop(chat[0].scrollHeight);
        }
    },

    setupEventListeners() {
        // Open character sheet when VTM button is clicked
        $(document).on('click', '#vtm_sheet', () => {
            this.loadCharacterData();
            $('#vtm_character_modal').show();
        });
        
        // Handle dice dropdown options
        $(document).on('click', '#vtm_dice_dropdown .list-group-item', (e) => {
            const action = $(e.target).data('value');
            this.handleDiceAction(action);
        });
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
        }
    },

    showSkillRollDialog() {
        // Advanced dialog for skill selection
        const dialog = `
        <div id="vtm_skill_roll" class="modal">
            <div class="modal-content" style="max-width: 600px;">
                <span class="close">&times;</span>
                <h3>Skill Check</h3>
                
                <div class="vtm-grid">
                    <div class="vtm-section">
                        <h4>Attribute</h4>
                        <select id="vtm_roll_attribute">
                            <option value="strength">Strength</option>
                            <option value="dexterity">Dexterity</option>
                            <option value="stamina">Stamina</option>
                            <option value="charisma">Charisma</option>
                            <option value="manipulation">Manipulation</option>
                            <option value="composure">Composure</option>
                            <option value="intelligence">Intelligence</option>
                            <option value="wits">Wits</option>
                            <option value="resolve">Resolve</option>
                        </select>
                    </div>
                    
                    <div class="vtm-section">
                        <h4>Skill</h4>
                        <select id="vtm_roll_skill">
                            <option value="athletics">Athletics</option>
                            <option value="brawl">Brawl</option>
                            <option value="firearms">Firearms</option>
                            <option value="persuasion">Persuasion</option>
                            <option value="intimidation">Intimidation</option>
                            <option value="investigation">Investigation</option>
                            <option value="stealth">Stealth</option>
                            <!-- Add more skills -->
                        </select>
                    </div>
                </div>
                
                <div class="vtm-section">
                    <label>Difficulty:</label>
                    <select id="vtm_skill_difficulty">
                        <option value="1">1 - Simple</option>
                        <option value="2" selected>2 - Standard</option>
                        <option value="3">3 - Challenging</option>
                        <option value="4">4 - Difficult</option>
                        <option value="5">5 - Extreme</option>
                    </select>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <button id="vtm_roll_skill_check" class="vtm-roll-button">Roll Skill Check</button>
                </div>
            </div>
        </div>
        `;
        
        $('body').append(dialog);
        $('#vtm_skill_roll').show();
        
        $('#vtm_skill_roll .close').on('click', () => {
            $('#vtm_skill_roll').remove();
        });
        
        $('#vtm_roll_skill_check').on('click', () => {
            const attribute = $('#vtm_roll_attribute').val();
            const skill = $('#vtm_roll_skill').val();
            const difficulty = parseInt($('#vtm_skill_difficulty').val());
            
            this.performSkillCheck(attribute, skill, difficulty);
            $('#vtm_skill_roll').remove();
        });
    },

    performSkillCheck(attribute, skill, difficulty) {
        const attrValue = this.getAttributeValue(attribute);
        const skillValue = this.getSkillValue(skill);
        const pool = attrValue + skillValue;
        const hunger = this.characterData.hunger || 0;
        
        const result = this.rollV5Dice(pool, difficulty, hunger, false);
        
        let output = `🎲 **${attribute.charAt(0).toUpperCase() + attribute.slice(1)} + ${skill.charAt(0).toUpperCase() + skill.slice(1)} Check**\n`;
        output += `Pool: ${pool} (${attrValue} + ${skillValue}), Difficulty: ${difficulty}\n\n`;
        
        // Add the roll result display
        output += this.formatRollResult(result);
        
        this.sendToChat(output);
    },

    getAttributeValue(attribute) {
        const categories = ['physical', 'social', 'mental'];
        for (const category of categories) {
            if (this.characterData.attributes[category][attribute] !== undefined) {
                return this.characterData.attributes[category][attribute];
            }
        }
        return 1;
    },

    getSkillValue(skill) {
        // Implementation to get skill value from character data
        return this.characterData.skills?.physical[skill] || 
               this.characterData.skills?.social[skill] || 
               this.characterData.skills?.mental[skill] || 0;
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
        const pool = (this.characterData.attributes.social.composure || 1) + (this.characterData.attributes.mental.resolve || 1);
        const hungerDice = Math.min(this.characterData.hunger || 0, pool);
        
        let output = `😡 **Frenzy Check**\n`;
        output += `Pool: Composure + Resolve = ${pool}, Hunger Dice: ${hungerDice}\n`;
        
        // Simplified frenzy check
        const result = this.rollV5Dice(pool, 3, hungerDice, false);
        output += this.formatRollResult(result);
        
        if (result.outcome === 'Failure' || result.outcome === 'Bestial Failure') {
            output += `\n\n💥 **Frenzy!** The Beast takes control.`;
        } else {
            output += `\n\n✅ **Resisted!** You maintain control.`;
        }
        
        this.sendToChat(output);
    },

    formatRollResult(result) {
        let output = `**Regular Dice:** `;
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
            output += `\n⚠️ **Messy Critical!**`;
        }
        
        if (result.bestialFailure) {
            output += `\n💀 **Bestial Failure!**`;
        }
        
        return output;
    }
};

// Initialize plugin when document is ready
jQuery(() => {
    VTM_PLUGIN.init();
});

export default VTM_PLUGIN;