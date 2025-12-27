/**
 * Request for comment editor
 * 
 * Adds/edits RFC template on a discussion
 */

$.when(mw.loader.using([
    'mediawiki.api',
    'mediawiki.jqueryMsg',
]))
    .then(() => new mw.Api().loadMessagesIfMissing([
        'comma-separator',
        'colon-separator',
        'semicolon-separator'
    ]))
    .then(() => mw.loader.using([
        'ext.gadget.HanAssist',
        'oojs-ui-core',
        'oojs-ui-widgets',
        'oojs-ui-windows',
    ]), $.ready)
    .then((require) => {
        window.EditRFC = window.EditRFC || {};
        const EditRFC = window.EditRFC;

        // Separators

        const COMMA_SEPARATOR = mw.msg('comma-separator');
        const COLON_SEPARATOR = mw.msg('colon-separator');
        const SEMICOLON_SEPARATOR = mw.msg('semicolon-separator');

        // Constants

        const api = new mw.Api();

        const batchConv = require('ext.gadget.HanAssist').batchConv;

        mw.messages.set(batchConv({
            'edit-rfc-button': {
                hant: '編輯RFC',
                hans: '编辑RFC'
            },
            'edit-rfc-button-inprogress': {
                hant: '正在載入……',
                hans: '正在载入……'
            },

            'edit-rfc-window-title': {
                hant: '編輯徵求意見模板',
                hans: '编辑征求意见模板'
            },
            'edit-rfc-window-confirm': '提交',

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

            'edit-rfc-message-new-rfc': {
                hant: '此討論尚未有徵求意見模板。點按「提交」後，機器人將會在十分鐘內將此討論加入徵求意見系統。',
                hans: '此讨论尚未有征求意见模板。点按“提交”后，机器人将在十分钟内将此讨论加入征求意见系统。'
            },
            'edit-rfc-message-no-rfcid': {
                hant: '此討論已有徵求意見模板，但機器人尚未運行。本話題將在十分鐘後自動加入徵求意見系統。本表單將修改本討論串所屬於的議題。',
                hans: '此讨论已有征求意见模板，但机器人尚未运行。本话题将在十分钟后自动加入征求意见系统。本表单将修改本讨论串所属于的议题。'
            },
            'edit-rfc-message-has-rfcid': {
                hant: '此討論已有徵求意見模板，且機器人已經運行。本表單將修改本討論串所屬於的議題，修改將於十分鐘內應用。',
                hans: '此讨论已有征求意见模板，且机器人已经运行。本表单将修改本讨论串所属于的议题，修改将于十分钟内应用。'
            },
            'edit-rfc-message-dryrun': {
                hant: '試運行模式已啓用，編輯將不會提交。如希望退出試運行模式，請在主控臺將$1設爲$2。',
                hans: '试运行模式已启用，编辑将不会提交。如希望退出试运行模式，请在控制台将$1设为$2。'
            },

            'edit-rfc-summary-add-template': {
                hant: '新增徵求意見模板',
                hans: '新增征求意见模板'
            },
            'edit-rfc-summary-edit-template': {
                hant: '編輯徵求意見模板',
                hans: '编辑征求意见模板'
            },
            'edit-rfc-summary-advertisement': '// [[User:1F616EMO/EditRFC.js|EditRFC]]',

            'edit-rfc-notify-succeed': {
                hant: '徵求意見模板已成功更新。',
                hans: '征求意见模板已成功更新。'
            },
            'edit-rfc-notify-fail': {
                hant: '無法更新徵求意見模板',
                hans: '无法更新征求意见模板'
            },

            // Topics

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
            return { content, revid, rfcTopics, rfcid };
        };

        const addRFCTemplate = function (content, topics, rfcId) {
            // If a RFC template exists, replace it
            if (rfcMatchRegex.test(content)) {
                return content.replace(rfcMatchRegex, constructRFCTemplate(topics, rfcId));
            }

            // Find the first line (except empty lines and first line (the title)) that does NOT match skipMatchRegex
            const lines = content.split('\n');
            let insertIndex = 1;
            for (let i = lines.length - 1; i >= 1; i--) {
                if (skipMatchRegex.test(lines[i])) {
                    insertIndex = i + 1;
                    break;
                }
            }

            // Insert the RFC template after last match of skipMatchRegex
            lines.splice(insertIndex, 0, constructRFCTemplate(topics, rfcId));

            // If there are empty lines immediately after {{rfc}}, remove them
            while (insertIndex + 1 < lines.length && lines[insertIndex + 1].trim() === '') {
                lines.splice(insertIndex + 1, 1);
            }

            return lines.join('\n');
        };

        const constructEditSummary = (oldTopics, newTopics) => {
            if (oldTopics.length === 0) {
                return mw.msg('edit-rfc-summary-add-template')
                    + COLON_SEPARATOR
                    + newTopics.map(topic => mw.msg(`edit-rfc-topic-${topic}`)).join(COMMA_SEPARATOR)
                    + ' ' + mw.msg('edit-rfc-summary-advertisement');
            }

            // Generate string in format + <xxx>, <yyy>; - <aaa>, <bbb>
            const addedTopics = newTopics.filter(topic => !oldTopics.includes(topic));
            const removedTopics = oldTopics.filter(topic => !newTopics.includes(topic));

            let summaryParts = [];
            if (addedTopics.length > 0) {
                summaryParts.push('+' + addedTopics.map(topic => mw.msg(`edit-rfc-topic-${topic}`)).join(COMMA_SEPARATOR));
            }
            if (removedTopics.length > 0) {
                summaryParts.push('-' + removedTopics.map(topic => mw.msg(`edit-rfc-topic-${topic}`)).join(COMMA_SEPARATOR));
            }

            return mw.msg('edit-rfc-summary-edit-template')
                + COLON_SEPARATOR
                + summaryParts.join(SEMICOLON_SEPARATOR)
                + ' ' + mw.msg('edit-rfc-summary-advertisement');
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

            this.newRFCMessage = new OO.ui.MessageWidget({
                label: mw.msg('edit-rfc-message-new-rfc'),
                type: 'info',
            });
            this.noRFCIDMessage = new OO.ui.MessageWidget({
                label: mw.msg('edit-rfc-message-no-rfcid'),
                type: 'info',
            });
            this.hasRFCIDMessage = new OO.ui.MessageWidget({
                label: mw.msg('edit-rfc-message-has-rfcid'),
                type: 'info',
            });
            this.dryrunMessage = new OO.ui.MessageWidget({
                label: $($.parseHTML(mw.message('edit-rfc-message-dryrun', '<code>EditRFC.dryrun</code>', '<code>false</code>').plain())),
                type: 'warning',
            });

            this.newRFCMessage.$element.addClass('edit-rfc-message');
            this.noRFCIDMessage.$element.addClass('edit-rfc-message');
            this.hasRFCIDMessage.$element.addClass('edit-rfc-message');
            this.dryrunMessage.$element.addClass('edit-rfc-message');

            this.panel.$element.append(this.newRFCMessage.$element);
            this.panel.$element.append(this.noRFCIDMessage.$element);
            this.panel.$element.append(this.hasRFCIDMessage.$element);
            this.panel.$element.append(this.dryrunMessage.$element);

            this.$body.append(this.panel.$element);
        };

        editRFCDialog.prototype.getSetupProcess = function (data) {
            data = data || {};
            this.setData(data);

            return editRFCDialog.super.prototype.getSetupProcess.call(this, data)
                .next(() => {
                    this.rfcSelectWidget.clearItems();
                    this.rfcSelectWidget.clearInput();

                    EditRFC.editRFCDialogInstance.rfcSelectWidget.menu.items.forEach(item => {
                        item.setHighlighted(false);
                        item.setSelected(false);
                    });

                    this.newRFCMessage.toggle(false);
                    this.noRFCIDMessage.toggle(false);
                    this.hasRFCIDMessage.toggle(false);
                    this.dryrunMessage.toggle(!!EditRFC.dryrun);

                    for (const topic of data.topics)
                        this.rfcSelectWidget.addTag(topic, mw.msg(`edit-rfc-topic-${topic}`));

                    if (data.topics.length === 0) {
                        this.newRFCMessage.toggle(true);
                    } else if (!data.rfcid || data.rfcid === '') {
                        this.noRFCIDMessage.toggle(true);
                    } else {
                        this.hasRFCIDMessage.toggle(true);
                    }

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

            const title = data.pagetitle;
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

            if (EditRFC.dryrun) {
                console.log('Dry run mode - edit not submitted.');
                mw.notify('Dry run mode - edit not submitted. Check console for more information.', { type: 'info' });
                return;
            }

            const editStatus = await doEdit(title, section, baserevid, newContent, editSummary);
            if (editStatus.success) {
                mw.notify(mw.msg('edit-rfc-notify-succeed'), { type: 'success' });
                window.location.reload();
            } else {
                console.error('Edit failed:', editStatus.error);
                mw.notify(mw.msg('edit-rfc-notify-fail') + COLON_SEPARATOR + editStatus.error.message, { type: 'error' });
            }
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
                    pagetitle: title,
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
                        $editrfcLink
                            .text(mw.msg('edit-rfc-button-inprogress'))
                            .addClass("edit-rfc-section-link-inprogress");
                        fetchAndOpenDialog(title, section)
                            .then(() => {
                                $editrfcLink
                                    .text(mw.msg('edit-rfc-button'))
                                    .removeClass("edit-rfc-section-link-inprogress");
                            })
                            .catch(() => {
                                $editrfcLink
                                    .text(mw.msg('edit-rfc-button'))
                                    .removeClass("edit-rfc-section-link-inprogress");
                            });
                    })
                $('<span>')
                    .html($editrfcLink)
                    .addClass('edit-rfc-section-link')
                    .insertAfter($sectionLink);
            });
        });

        mw.util.addCSS(`
            .mw-editsection .edit-rfc-section-link::before {
                content: ' | ';
            }

            .mw-editsection .edit-rfc-section-link-inprogress {
                color: var(--color-placeholder,#72777d);
                pointer-events: none;
            }

            .edit-rfc-message {
                margin-top: 12px;
            }
        `);
    });