/**
 * Request for comment editor
 * 
 * Adds/edits RFC template on a discussion
 */

$.when(mw.loader.using([
    'mediawiki.api',
    'mediawiki.jqueryMsg',
    'ext.gadget.HanAssist',
    'oojs-ui-core',
    'oojs-ui-widgets',
    'oojs-ui-windows',
]), $.ready).then((require) => {
    window.EditRFC = {};
    const EditRFC = window.EditRFC;

    // Constants

    const batchConv = require('ext.gadget.HanAssist').batchConv;

    mw.messages.set(batchConv({
        'edit-rfc-button': {
            hant: '編輯RFC',
            hans: '编辑RFC'
        },

        'edit-rfc-window-title': {
            hant: '編輯徵求意見模板',
            hans: '编辑征求意见模板'
        },
        'edit-rfc-window-confirm': '提交',
        'edit-rfc-window-cancel': '取消',
        'edit-rfc-field-topics-label': {
            hant: '所屬議題',
            hans: '所属议题'
        },
        'edit-rfc-field-topics-aria-label': {
            hant: '本討論應屬於的徵求意見主題',
            hans: '本讨论应属于的征求意见主题'
        },
        'edit-rfc-field-topics-noresult': {
            hant: '無符合結果',
            hans: '无符合结果'
        },

        'edit-rfc-summary-add-template': {
            hant: '新增徵求意見模板：$1',
            hans: '新增征求意见模板：$1'
        },
        'edit-rfc-summary-edit-template': {
            hant: '編輯徵求意見模板：$1',
            hans: '编辑征求意见模板：$1'
        },

        'edit-rfc-topic-bio': {
            hant: '傳記',
            hans: '传记'
        },
        'edit-rfc-topic-econ': {
            hant: '經濟、貿易與公司',
            hans: '经济、贸易与公司'
        },
        'edit-rfc-topic-hist': {
            hant: '歷史與地理',
            hans: '历史与地理'
        },
        'edit-rfc-topic-lang': {
            hant: '語言及語言學',
            hans: '语言及语言学'
        },
        'edit-rfc-topic-sci': {
            hant: '數學、科學與科技',
            hans: '数学、科学与科技'
        },
        'edit-rfc-topic-media': {
            hant: '媒體、藝術與建築',
            hans: '媒体、艺术与建筑'
        },
        'edit-rfc-topic-pol': {
            hant: '政治、政府與法律',
            hans: '政治、政府与法律'
        },
        'edit-rfc-topic-reli': {
            hant: '宗教與哲學',
            hans: '宗教与哲学'
        },
        'edit-rfc-topic-soc': {
            hant: '社會、體育運動與文化',
            hans: '社会、体育运动与文化'
        },
        'edit-rfc-topic-style': {
            hant: '維基百科格式與命名',
            hans: '维基百科格式与命名'
        },
        'edit-rfc-topic-policy': {
            hant: '維基百科方針與指引',
            hans: '维基百科方针与指引'
        },
        'edit-rfc-topic-proj': {
            hant: '維基專題與協作',
            hans: '维基专题与协作'
        },
        'edit-rfc-topic-tech': {
            hant: '維基百科技術議題與模板',
            hans: '维基百科技术议题与模板'
        },
        'edit-rfc-topic-prop': {
            hant: '維基百科提議',
            hans: '维基百科提议'
        },
    }));

    const rfcMatchRegex = /{{(?:[Rr]fc(?: subpage)?|[徵征]求意[見见])((?:\|[a-z]+)+?)(?:\|rfcid=([a-z0-9]+))?}}/;

    const findRFCInSection = (sectionText) => {
        const match = sectionText.match(rfcMatchRegex);
        if (match) {
            const params = match[1].slice(1).split('|');
            const topics = params.map(param => param.trim());
            const rfcId = match[2] || null;
            return { topics, rfcId };
        }
        return null;
    };

    const constructRFCTemplate = (topics, rfcId) => {
        let template = '{{Rfc';
        topics.forEach(topic => {
            template += `|${topic}`;
        });
        if (rfcId) {
            template += `|rfcid=${rfcId}`;
        }
        template += '}}';
        return template;
    };

    const rfcTopics = [
        // Article topics
        'bio', 'econ', 'hist', 'lang', 'sci', 'media', 'pol', 'reli', 'soc',
        // Project-wide topics
        'style', 'policy', 'proj', 'tech', 'prop'
    ];

    // Codex dialog

    const Vue = require('vue');
    const Codex = require('@wikimedia/codex');
    const codexMountPoint = document.body.appendChild(document.createElement('div'));

    const ref = Vue.ref;
    const reactive = Vue.reactive;

    Vue.createMwApp({
        data() {
            return {
                showDialog: false,
                rfcTopics: rfcTopics,
                selection: [], // Populated by setup()
                rfcId: '', // Populated by setup()
                sectionID: 0, // Populated by setup()
                baserevid: 0, // Populated by setup()

                defaultAction: {
                    label: mw.msg('edit-rfc-window-cancel'),
                },
                primaryAction: {
                    label: mw.msg('edit-rfc-window-confirm'),
                    actionType: 'progressive',
                },

                windowTitle: mw.msg('edit-rfc-window-title'),
                fieldLabel: mw.msg('edit-rfc-field-topics-label'),
                fieldAriaLabel: mw.msg('edit-rfc-field-topics-aria-label'),
                confirmButtonText: mw.msg('edit-rfc-window-confirm'),
                noResultText: mw.msg('edit-rfc-field-topics-noresult'),
            };
        },
        template: `
            <cdx-dialog
                v-model:open="showDialog"
                :title="windowTitle"
                :use-close-button="true"
                :default-action="defaultAction"
                :primary-action="primaryAction"
                @primary="onPrimaryAction"
                @default="showDialog = false"
            >
                <cdx-multiselect-lookup
                    id="cdx-edit-rfc-field-topics"
                    v-model:input-chips="chips"
                    v-model:selected="selection"
                    :menu-items="rfcTopics"
                    :aria-label="fieldAriaLabel"
                    @input="onInput"
                >
                    <template #no-results>
                        {{ noResultText }}
                    </template>
                </cdx-multiselect-lookup>
            </cdx-dialog>   
        `,
        methods: {
            onPrimaryAction() {
                // Handle primary action logic here
                console.log('Primary action taken');
                this.showDialog = false;
            },
            openDialog(selection, rfcId, sectionID, baserevid) {
                this.selection = selection;
                this.rfcId = rfcId;
                this.sectionID = sectionID;
                this.baserevid = baserevid;
                this.menuItems = this.rfcTopics;

                this.onInput = (value) => {
                    if ( value ) {
                        this.menuItems = this.rfcTopics.filter( ( item ) => item.label.includes( value ) || item.value.includes( value ) );
                    } else {
                        // When the input is cleared, show the suggestions again.
                        this.menuItems = this.rfcTopics;
                    }
                }

                this.showDialog = true;
            }
        },
        mounted() {
            EditRFC.dialogApp = this;
            EditRFC.openDialog = this.openDialog.bind(this);
        }
    })
        .component('cdx-dialog', Codex.CdxDialog)
        .component('cdx-multiselect-lookup', Codex.CdxMultiselectLookup)
        .mount(codexMountPoint);
});

/*
v-model:input-chips="chips"
                v-model:selected="selection"
                :menu-items="rfcTopics"
                :aria-label="fieldAriaLabel"

                 */