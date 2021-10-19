import joplin from 'api';
import { SettingItemType, ToolbarButtonLocation } from 'api/types';

joplin.plugins.register({
	onStart: async function() {
		await joplin.settings.registerSection('autolinker', {
			label: 'Autolinker',
			iconName: 'fas fa-external-link-alt',
		});
		
		await joplin.settings.registerSettings({
			'backlinkText': {
				value: 'Linked from',
				type: SettingItemType.String,
				section: 'autolinker',
				public: true,
				label: 'Backlink text (leave blank for no backlink)',
			},
		});
		joplin.commands.register({
			name: 'linkMaker',
			label: 'Link to corresponding note. Creates it if needed.',
			iconName: 'fas fa-external-link-alt',
			execute: async () => {
				const notes = (await joplin.data.get(['notes']));
				const currentNote = await joplin.workspace.selectedNote();	
				const selectedText = (await joplin.commands.execute('selectedText') as string);
				
				if (selectedText !== ""){
					//console.info('Clic !', selectedText);

					//Check if note already exists
					var idLinkedNote = 0;
					for (let i in notes.items){
						//console.info(notes.items[i].title);
						if (notes.items[i].title.toLowerCase() === selectedText.toLowerCase()){
							idLinkedNote = notes.items[i].id;	
							console.info('Found note with title ', notes.items[i].title, selectedText ,idLinkedNote);
							break;
						}
					}


					//Else : make it:
					if (idLinkedNote === 0){
						const newNote = await joplin.data.post(['notes'], null, { body: "", title: selectedText});
						idLinkedNote = newNote.id
					}

					//console.info(idLinkedNote);
					
					//Insert backlink :
					const backlinkText = await joplin.settings.value('backlinkText');
					const bodyLinkedNote = (await joplin.data.get(['notes', idLinkedNote.toString()], { fields: ['body'] })).body;
					let backlink;
					let newBodyLinkedNote;
					if (backlinkText !== ""){
						backlink = backlinkText + ' [' + currentNote.title + '](:/' + currentNote.id + ')';
						newBodyLinkedNote = bodyLinkedNote + "\n" + backlink;
					}else{
						newBodyLinkedNote = bodyLinkedNote;
					}
					await joplin.data.put(['notes', idLinkedNote.toString()], null, { body: newBodyLinkedNote });

					const linkToNewNote = '[' + selectedText + '](:/' + idLinkedNote + ')';

					await joplin.commands.execute('replaceSelection', linkToNewNote);
				}
			},
		});
		
		joplin.views.toolbarButtons.create('linkMaker', 'linkMaker', ToolbarButtonLocation.EditorToolbar);
	},
});
