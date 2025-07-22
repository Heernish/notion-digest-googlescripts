/**
 * Labels sent Notion Digest emails with the "Notion" label.
 */
function labelSentNotionDigests() {
  //Create or get the label
  const labelName = 'Notion';
  let label = GmailApp.getUserLabelByName(labelName);
  if (!label) label = GmailApp.createLabel(labelName);

  //Find sent threads with “Notion Digest” in the subject from the last day
  const query = 'in:sent subject:"Notion Digest" newer_than:1d';
  const threads = GmailApp.search(query);

  //Apply the label
  threads.forEach(thread => thread.addLabel(label));
}
