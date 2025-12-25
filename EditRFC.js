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
    window.EditRFC = window.EditRFC || {};
    const EditRFC = window.EditRFC;

    // Constants

    const api = new mw.Api();

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
        'edit-rfc-field-topics-help': {
            hant: '本討論應屬於的徵求意見主題',
            hans: '本讨论应属于的征求意见主题'
        },

        'edit-rfc-field-rfcid-label': {
            hant: '徵求意見話題編號',
            hans: '征求意见话题编号'
        },
        'edit-rfc-field-rfcid-help': {
            hant: '由機器人填寫的話題編號',
            hans: '由机器人填写的话题编号'
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

    const rfcMatchRegex = /{{(?:[Rr]fc(?: subpage)?|[徵征]求意[見见])((?:\|[a-z]+)*?)(?:\|rfcid=([a-z0-9]+))?}}/;
    const skipMatchRegex = /^\s*{{(存[檔档][自至到]|[Ss]ave ?to|[Aa]rchive(?: ?to)|[Nn]osave|保存至|已?移[動动][自至到]|[Mm]oved?(?:(?: discussion | )?to)?|(?:[Mm]ov|[Ss]av|[Aa]rchiev)ed? ?from|[Ss]witchfrom|[Mm]OVEDFROM|[Mm]oved discussion from)(?:\|.*?)?}}\s*$/;

    const rfcTopics = [
        // Article topics
        'bio', 'econ', 'hist', 'lang', 'sci', 'media', 'pol', 'reli', 'soc',
        // Project-wide topics
        'style', 'policy', 'proj', 'tech', 'prop'
    ];

    // Functions

    const findRFCInSection = (sectionText) => {
        const match = sectionText.match(rfcMatchRegex);
        if (match) {
            const params = match[1].slice(1).split('|');
            const topics = params.map(param => param.trim());
            const rfcid = match[2] || null;
            return { topics, rfcid };
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

    const fetchAndAnalyseSection = async (title, section) => {
        const response = await api.get({
            action: 'query',
            prop: 'revisions',
            titles: title,
            rvslots: 'main',
            rvprop: 'content|ids',
            rvsection: section,
            formatversion: 2
        });

        const page = response.query.pages[0];
        if (!page || page.missing) {
            throw new Error('Page not found');
        }

        const revision = page.revisions[0];
        const revid = revision.revid;
        const content = revision.slots.main.content;

        // Match rfc template
        const rfcData = findRFCInSection(content) || {};
        const rfcTopics = rfcData.topics || [];
        const rfcid = rfcData.rfcid || null;
        return { content, revid, rfcTopics, rfcid};
    };

    const addRFCTemplate = function (content, topics, rfcId) {
        // If a RFC template exists, replace it
        if (rfcMatchRegex.test(content)) {
            return content.replace(rfcMatchRegex, constructRFCTemplate(topics, rfcId));
        }

        // Find the first line (except empty lines and first line (the title)) that does NOT match skipMatchRegex
        const lines = content.split('\n');
        let insertIndex = lines.length;
        for (let i = 1; i < lines.length; i++) {
            if (!skipMatchRegex.test(lines[i])) {
                insertIndex = i;
                break;
            }
        }

        // Insert the RFC template after last match of skipMatchRegex
        lines.splice(insertIndex, 0, constructRFCTemplate(topics, rfcId));
        return lines.join('\n');
    };

    const constructEditSummary = (oldTopics, newTopics) => {
        if (oldTopics.length === 0) {
            return mw.msg('edit-rfc-summary-add-template', newTopics.map(topic => mw.msg(`edit-rfc-topic-${topic}`)).join(', '));
        }

        // Generate string in format + <xxx>, <yyy>; - <aaa>, <bbb>
        const addedTopics = newTopics.filter(topic => !oldTopics.includes(topic));
        const removedTopics = oldTopics.filter(topic => !newTopics.includes(topic));

        let summaryParts = [];
        if (addedTopics.length > 0) {
            summaryParts.push('+ ' + addedTopics.map(topic => mw.msg(`edit-rfc-topic-${topic}`)).join(', '));
        }
        if (removedTopics.length > 0) {
            summaryParts.push('- ' + removedTopics.map(topic => mw.msg(`edit-rfc-topic-${topic}`)).join(', '));
        }

        return mw.msg('edit-rfc-summary-edit-template', summaryParts.join('; '));
    };

    const doEdit = async (title, section, baserevid, content, summary) => {
        try {
            const response = await api.postWithEditToken({
                action: 'edit',
                title: title,
                section: section,
                baserevid: baserevid,
                text: content,
                summary: summary,
                formatversion: 2
            });
            return { success: true, response: response };
        } catch (error) {
            return {
                success: false,
                error: error,
            };
        }
    };


    // OOUI Dialog

    const editRFCDialog = EditRFC.editRFCDialog = function (config) {
        editRFCDialog.super.call(this, config);
    };
    OO.inheritClass(editRFCDialog, OO.ui.ProcessDialog);

    editRFCDialog.static.name = 'editRFCDialog';
    editRFCDialog.static.title = mw.msg('edit-rfc-window-title');
    editRFCDialog.static.actions = [
        { action: 'confirm', label: mw.msg('edit-rfc-window-confirm'), flags: ['primary', 'progressive'] },
        { label: mw.msg('edit-rfc-window-cancel'), flags: ['safe', 'close'] }
    ];

    editRFCDialog.prototype.initialize = function () {
        editRFCDialog.super.prototype.initialize.apply(this, arguments);

        this.panel = new OO.ui.PanelLayout({
            padded: true,
            expanded: false
        });

        const fieldset = this.content = new OO.ui.FieldsetLayout();

        const rfcSelectWidget = this.rfcSelectWidget = new OO.ui.MenuTagMultiselectWidget({
            options: rfcTopics.map(topic => ({
                data: topic,
                label: mw.msg(`edit-rfc-topic-${topic}`)
            })),
        });

        const rfcIdWidget = this.rfcIdWidget = new OO.ui.TextInputWidget({
            disabled: true,
        });

        fieldset.addItems([
            new OO.ui.FieldLayout(rfcSelectWidget, {
                label: mw.msg('edit-rfc-field-topics-label'),
                align: 'top',
                help: mw.msg('edit-rfc-field-topics-help'),
            }),
            new OO.ui.FieldLayout(rfcIdWidget, {
                label: mw.msg('edit-rfc-field-rfcid-label'),
                align: 'top',
                help: mw.msg('edit-rfc-field-rfcid-help'),
            }),
        ]);

        this.panel.$element.append(fieldset.$element);
        this.$body.append(this.panel.$element);
    };

    editRFCDialog.prototype.getSetupProcess = function (data) {
        data = data || {};
        this.setData(data);

        return editRFCDialog.super.prototype.getSetupProcess.call(this, data)
            .next(() => {
                this.rfcSelectWidget.clearItems();
                this.rfcSelectWidget.clearInput();

                for (const topic of data.topics)
                    this.rfcSelectWidget.addTag(topic, mw.msg(`edit-rfc-topic-${topic}`));

                this.rfcIdWidget.setValue(data.rfcid || '');
            });
    };

    editRFCDialog.prototype.getActionProcess = function (action) {
        if (action === 'confirm')
            return editRFCDialog.super.prototype.getActionProcess.call(this, action)
                .next(() => this.onConfirm())
                .next(() => this.close().closed.promise());
        return editRFCDialog.super.prototype.getActionProcess.call(this, action);
    };

    editRFCDialog.prototype.onConfirm = async function () {
        const data = this.data;

        const title = data.title;
        const section = data.section;
        const topics = this.rfcSelectWidget.getValue();
        const rfcid = data.rfcid; // Keep existing RFC ID

        console.log('Submitting RFC edit');
        console.table(data);

        const oldContent = data.content;
        const baserevid = data.revid;

        const newContent = addRFCTemplate(oldContent, topics, rfcid);
        const editSummary = constructEditSummary(data.topics, topics);

        console.table({ oldContent, baserevid, newContent, editSummary });
    };

    // Methods to open the dialog

    const windowManager = new OO.ui.WindowManager();
    $(document.body).append(windowManager.$element);

    let editRFCDialogInstance = null;
    const openEditRFCDialog = EditRFC.openEditRFCDialog = function (data) {
        if (!editRFCDialogInstance) {
            EditRFC.editRFCDialogInstance = editRFCDialogInstance = new editRFCDialog();
            windowManager.addWindows([editRFCDialogInstance]);
        }
        windowManager.openWindow(editRFCDialogInstance, data);
    }

    const fetchAndOpenDialog = EditRFC.fetchAndOpenDialog = async function (title, section) {
        try {
            const analysis = await fetchAndAnalyseSection(title, section);
            openEditRFCDialog({
                title: title,
                section: section,
                content: analysis.content,
                revid: analysis.revid,
                topics: analysis.rfcTopics,
                rfcid: analysis.rfcid,
            });
        } catch (error) {
            console.error('Failed to fetch section data:', error);
            mw.notify('Failed to fetch section data: ' + error.message, { type: 'error' });
        }
    }

    // Section edit link handler
    mw.hook('wikipage.content').add(($content) => {
        $content.find('.mw-editsection').each(function () {
            const $editsection = $(this);
            const $sectionLink = $editsection.find('a').first();

            const title = mw.config.get('wgPageName');
            const href = $sectionLink.attr('href');
            const section = mw.util.getParamValue('section', href);

            const $editrfcLink = $('<a>')
                .text(mw.msg('edit-rfc-button'))
                .attr('href', '#')
                .on('click', (e) => {
                    e.preventDefault();
                    fetchAndOpenDialog(title, section);
                })
            $('<span>')
                .html($editrfcLink)
                .addClass('edit-rfc-section-link')
                .insertAfter($sectionLink);
        });
    });

    mw.util.addCSS(`.mw-editsection  .edit-rfc-section-link::before { content: ' | '; }`);
});

/*
v-model:input-chips="chips"
                v-model:selected="selection"
                :menu-items="rfcTopics"
                :aria-label="fieldAriaLabel"

                 */