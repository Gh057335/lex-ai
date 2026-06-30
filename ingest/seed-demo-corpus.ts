/**
 * Seed a demo legal corpus for the LEXAI MVP.
 *
 * Inserts representative excerpts of key DIFC + ADGM statutes into
 * `legal_sources` + `legal_chunks`. These are paraphrases of public statutes
 * for demo purposes — replace with the official PDF text via the proper
 * ingestion pipeline before production use.
 *
 * Run: `bun src/ingest/seed-demo-corpus.ts`
 */

import { createAdminClient } from '@/lib/supabase';

interface Source {
  key: string;
  jurisdiction: string;
  sector: string | null;
  source_type: 'statute' | 'regulation' | 'rulebook' | 'case' | 'model_contract' | 'standard' | 'guidance';
  title: string;
  publisher: string;
  official_url: string;
  effective_from: string;
  chunks: Array<{ locator: string; heading: string[]; body: string }>;
}

const SOURCES: Source[] = [
  {
    key: 'ae-difc:contract-law:2004',
    jurisdiction: 'ae-difc',
    sector: null,
    source_type: 'statute',
    title: 'DIFC Contract Law (DIFC Law No. 6 of 2004)',
    publisher: 'Dubai International Financial Centre',
    official_url: 'https://www.difc.ae/business/laws-and-regulations/legal-database/contract-law-difc-law-no-6-2004',
    effective_from: '2004-09-13',
    chunks: [
      { locator: 'Art. 13', heading: ['Part 2', 'Formation'], body: 'A contract is concluded, modified or terminated by the mere agreement of the parties, without any further requirement. An offer becomes effective when it reaches the offeree. The acceptance of an offer becomes effective when the indication of assent reaches the offeror.' },
      { locator: 'Art. 17', heading: ['Part 2', 'Formation'], body: 'A statement made by or other conduct of the offeree indicating assent to an offer is an acceptance. Silence or inactivity does not in itself amount to acceptance.' },
      { locator: 'Art. 22', heading: ['Part 2', 'Formation'], body: 'Where in the course of negotiations one of the parties insists that the contract is not concluded until there is agreement on specific matters or in a specific form, no contract is concluded before agreement is reached on those matters or in that form.' },
      { locator: 'Art. 49', heading: ['Part 4', 'Validity'], body: 'A party may avoid the contract when it has been led to conclude the contract by the other party\'s fraudulent representation, including language or practices, or fraudulent non-disclosure of circumstances which, according to reasonable commercial standards of fair dealing, the latter party should have disclosed.' },
      { locator: 'Art. 57', heading: ['Part 5', 'Interpretation'], body: 'A contract shall be interpreted according to the common intention of the parties. If such an intention cannot be established, the contract shall be interpreted according to the meaning that reasonable persons of the same kind as the parties would give to it in the same circumstances.' },
      { locator: 'Art. 86', heading: ['Part 7', 'Performance'], body: 'A party may withhold performance of its obligations until the other party has tendered its performance, where the parties are to perform simultaneously. A party who is to perform later may withhold its performance until the other party has performed.' },
      { locator: 'Art. 110', heading: ['Part 8', 'Non-performance'], body: 'Either party may terminate the contract where the failure of the other party to perform an obligation under the contract amounts to a fundamental non-performance. In determining whether a failure to perform an obligation amounts to a fundamental non-performance, regard shall be had to whether the non-performance substantially deprives the aggrieved party of what it was entitled to expect under the contract.' },
      { locator: 'Art. 119', heading: ['Part 9', 'Damages'], body: 'The aggrieved party is entitled to damages for harm sustained as a result of the non-performance. The harm includes both any loss which it suffered and any gain of which it was deprived, taking into account any gain to the aggrieved party resulting from its avoidance of cost or harm.' },
    ],
  },
  {
    key: 'ae-difc:data-protection-law:2020',
    jurisdiction: 'ae-difc',
    sector: 'data_protection',
    source_type: 'statute',
    title: 'DIFC Data Protection Law (DIFC Law No. 5 of 2020)',
    publisher: 'Dubai International Financial Centre',
    official_url: 'https://www.difc.ae/business/laws-and-regulations/legal-database/data-protection-law-difc-law-no-5-2020',
    effective_from: '2020-07-01',
    chunks: [
      { locator: 'Art. 9', heading: ['Part 3', 'Principles'], body: 'Personal Data must be: (a) processed lawfully, fairly and in a transparent manner in relation to a Data Subject; (b) collected for specified, explicit and legitimate purposes; (c) adequate, relevant and limited to what is necessary; (d) accurate and, where necessary, kept up to date; (e) kept in a form which permits identification of Data Subjects for no longer than necessary; (f) processed in a manner that ensures appropriate security.' },
      { locator: 'Art. 10', heading: ['Part 3', 'Lawfulness'], body: 'Processing of Personal Data is lawful only if and to the extent that at least one of the following applies: consent; performance of a contract; compliance with a legal obligation; protection of vital interests; performance of a task carried out in the public interest; or legitimate interests pursued by the Controller.' },
      { locator: 'Art. 28', heading: ['Part 5', 'Transfers'], body: 'A transfer of Personal Data to a Recipient located in a jurisdiction outside the DIFC may take place where the Commissioner has issued a determination that the jurisdiction ensures an adequate level of protection, or where the Controller has provided appropriate safeguards including binding corporate rules or standard contractual clauses.' },
      { locator: 'Art. 41', heading: ['Part 6', 'Breach'], body: 'In the case of a Personal Data Breach that compromises a Data Subject\'s confidentiality, security or privacy, the Controller shall notify the Commissioner without undue delay and, where feasible, within 72 hours after becoming aware of the breach.' },
      { locator: 'Art. 50', heading: ['Part 8', 'Enforcement'], body: 'The Commissioner may impose an administrative fine of up to USD 100,000 for contraventions of this Law, and in serious cases may refer the matter to the DIFC Court for the imposition of higher penalties or compensation orders.' },
    ],
  },
  {
    key: 'ae-difc:employment-law:2019',
    jurisdiction: 'ae-difc',
    sector: 'employment',
    source_type: 'statute',
    title: 'DIFC Employment Law (DIFC Law No. 2 of 2019)',
    publisher: 'Dubai International Financial Centre',
    official_url: 'https://www.difc.ae/business/laws-and-regulations/legal-database/employment-law-difc-law-no-2-2019',
    effective_from: '2019-08-28',
    chunks: [
      { locator: 'Art. 11', heading: ['Part 3', 'Written particulars'], body: 'An Employer shall, no later than one month after an Employee\'s commencement date, provide the Employee with a written employment contract setting out: names of the parties, commencement date, job title, place of work, hours, remuneration, leave entitlements, notice period and any probation period.' },
      { locator: 'Art. 27', heading: ['Part 5', 'Working time'], body: 'The maximum working time of an Employee shall not exceed an average of 48 hours per week. An Employee may agree in writing that the limit shall not apply, but may withdraw such agreement by giving the Employer not less than seven days\' written notice.' },
      { locator: 'Art. 30', heading: ['Part 6', 'Leave'], body: 'An Employee is entitled to paid annual leave of not less than 20 working days per year, accruing pro rata. National holidays shall be in addition to annual leave.' },
      { locator: 'Art. 33', heading: ['Part 6', 'Sick leave'], body: 'An Employee is entitled to sick leave of up to 60 working days in any 12 month period: the first 10 days at full pay, the next 20 days at half pay and the final 30 days unpaid.' },
      { locator: 'Art. 60', heading: ['Part 9', 'Termination'], body: 'Either party may terminate an Employee\'s employment for cause without notice in circumstances where the conduct of one party warrants termination and where a reasonable employer would have terminated the employment. In any other case, a minimum notice period of 30 days (after 5 years\' service: 90 days) applies.' },
      { locator: 'Art. 66', heading: ['Part 10', 'End of service'], body: 'An Employee who completes one year or more of continuous employment is entitled to an end of service gratuity calculated as 21 days of basic wage for each of the first five years of service, and 30 days of basic wage for each additional year.' },
    ],
  },
  {
    key: 'ae-difc:companies-law:2018',
    jurisdiction: 'ae-difc',
    sector: 'corporate',
    source_type: 'statute',
    title: 'DIFC Companies Law (DIFC Law No. 5 of 2018)',
    publisher: 'Dubai International Financial Centre',
    official_url: 'https://www.difc.ae/business/laws-and-regulations/legal-database/companies-law-difc-law-no-5-2018',
    effective_from: '2018-11-12',
    chunks: [
      { locator: 'Art. 13', heading: ['Part 3', 'Incorporation'], body: 'A Private Company shall have at least one shareholder and at least one director who is a natural person. A Public Company shall have at least two directors. The articles of association shall be filed with the Registrar in the prescribed form.' },
      { locator: 'Art. 50', heading: ['Part 5', 'Directors\' duties'], body: 'A Director of a Company owes the following duties to the Company: to act within powers; to promote the success of the Company; to exercise independent judgement; to exercise reasonable care, skill and diligence; to avoid conflicts of interest; not to accept benefits from third parties; and to declare interests in proposed transactions.' },
      { locator: 'Art. 75', heading: ['Part 6', 'Share capital'], body: 'A Company shall not reduce its share capital except in accordance with this Law and its articles. A reduction requires a special resolution and confirmation by the Court unless the directors make a solvency statement supporting the reduction.' },
      { locator: 'Art. 99', heading: ['Part 8', 'Accounts'], body: 'Every Company shall keep accounting records sufficient to show and explain the Company\'s transactions and disclose with reasonable accuracy the financial position of the Company at any time. Records shall be preserved for at least 10 years.' },
    ],
  },
  {
    key: 'ae-adgm:companies-regulations:2020',
    jurisdiction: 'ae-adgm',
    sector: 'corporate',
    source_type: 'regulation',
    title: 'ADGM Companies Regulations 2020',
    publisher: 'Abu Dhabi Global Market',
    official_url: 'https://en.adgm.thomsonreuters.com/rulebook/companies-regulations-2020',
    effective_from: '2020-04-12',
    chunks: [
      { locator: 'Reg. 17', heading: ['Part 2', 'Incorporation'], body: 'An application for the registration of a company shall be delivered to the Registrar and shall state: the proposed company name; the situation of the registered office; whether the liability of members is limited; whether the company is private or public; and the names and details of the proposed directors and members.' },
      { locator: 'Reg. 154', heading: ['Part 7', 'Directors'], body: 'A director of a company must act in the way he considers, in good faith, would be most likely to promote the success of the company for the benefit of its members as a whole, and in doing so have regard to the likely consequences of any decision in the long term, the interests of employees, the impact on the community and the environment, and the desirability of maintaining a reputation for high standards.' },
      { locator: 'Reg. 175', heading: ['Part 7', 'Directors\' conflicts'], body: 'A director of a company must avoid a situation in which he has, or can have, a direct or indirect interest that conflicts, or possibly may conflict, with the interests of the company. This duty is not infringed if the situation cannot reasonably be regarded as likely to give rise to a conflict, or if the matter has been authorised by the directors in accordance with the regulations.' },
    ],
  },
  {
    key: 'ae-adgm:data-protection-regulations:2021',
    jurisdiction: 'ae-adgm',
    sector: 'data_protection',
    source_type: 'regulation',
    title: 'ADGM Data Protection Regulations 2021',
    publisher: 'Abu Dhabi Global Market',
    official_url: 'https://en.adgm.thomsonreuters.com/rulebook/data-protection-regulations-2021',
    effective_from: '2021-02-14',
    chunks: [
      { locator: 'Reg. 6', heading: ['Part 2', 'Principles'], body: 'Personal Data shall be processed in accordance with the rights of Data Subjects. The Controller is responsible for, and must be able to demonstrate compliance with, the principles relating to processing of Personal Data including lawfulness, fairness, purpose limitation, data minimisation, accuracy, storage limitation, integrity and confidentiality.' },
      { locator: 'Reg. 39', heading: ['Part 5', 'Breach'], body: 'In the case of a Personal Data Breach, the Controller shall without undue delay and, where feasible, not later than 72 hours after becoming aware of it, notify the Personal Data Breach to the Commissioner of Data Protection, unless the Personal Data Breach is unlikely to result in a risk to the rights of natural persons.' },
    ],
  },
  {
    key: 'ae-difc:arbitration-law:2008',
    jurisdiction: 'ae-difc',
    sector: null,
    source_type: 'statute',
    title: 'DIFC Arbitration Law (DIFC Law No. 1 of 2008)',
    publisher: 'Dubai International Financial Centre',
    official_url: 'https://www.difc.ae/business/laws-and-regulations/legal-database/arbitration-law-difc-law-no-1-2008',
    effective_from: '2008-09-01',
    chunks: [
      { locator: 'Art. 12', heading: ['Part 2', 'Arbitration agreement'], body: 'An Arbitration Agreement is an agreement by the parties to submit to arbitration all or certain disputes which have arisen or which may arise between them. The Arbitration Agreement shall be in writing. An Arbitration Agreement is in writing if its content is recorded in any form, including electronic communication.' },
      { locator: 'Art. 16', heading: ['Part 3', 'Tribunal'], body: 'The parties are free to determine the number of arbitrators. Failing such determination, the number of arbitrators shall be one. The parties are free to agree on a procedure of appointing the arbitrator or arbitrators. Failing such agreement, the DIFC Court shall, at the request of a party, appoint the arbitrator.' },
      { locator: 'Art. 41', heading: ['Part 6', 'Award'], body: 'An award shall be made in writing and shall be signed by the arbitrator or arbitrators. The award shall state the reasons upon which it is based, unless the parties have agreed that no reasons are to be given. The award shall state the date and the seat of arbitration.' },
      { locator: 'Art. 44', heading: ['Part 7', 'Recognition'], body: 'An arbitral award, irrespective of the State or jurisdiction in which it was made, shall be recognised as binding within the DIFC and, upon application in writing to the DIFC Court, shall be enforced subject to the provisions of this Article and Article 44(2).' },
    ],
  },
  {
    key: 'ae-difc:insolvency-law:2019',
    jurisdiction: 'ae-difc',
    sector: 'corporate',
    source_type: 'statute',
    title: 'DIFC Insolvency Law (DIFC Law No. 1 of 2019)',
    publisher: 'Dubai International Financial Centre',
    official_url: 'https://www.difc.ae/business/laws-and-regulations/legal-database/insolvency-law-difc-law-no-1-2019',
    effective_from: '2019-06-13',
    chunks: [
      { locator: 'Art. 13', heading: ['Part 3', 'Rehabilitation'], body: 'A Rehabilitation Plan may be proposed in relation to a Company which is, or is likely to become, unable to pay its debts. The proposal may be made by the Company itself, its directors, or any creditor or shareholder. The Plan shall set out the proposed steps to enable the Company to continue as a going concern.' },
      { locator: 'Art. 30', heading: ['Part 4', 'Administration'], body: 'A Company is in Administration while the appointment of an Administrator has effect. An Administrator is an officer of the DIFC Court. The Administrator must perform his or her functions with the objective of rescuing the Company as a going concern, or achieving a better result for the Company\'s creditors as a whole than would be likely on a winding-up.' },
    ],
  },
  {
    key: 'ae-difc:netting-law:2014',
    jurisdiction: 'ae-difc',
    sector: 'financial',
    source_type: 'statute',
    title: 'DIFC Netting Law (DIFC Law No. 2 of 2014)',
    publisher: 'Dubai International Financial Centre',
    official_url: 'https://www.difc.ae/business/laws-and-regulations/legal-database/netting-law-difc-law-no-2-2014',
    effective_from: '2014-08-21',
    chunks: [
      { locator: 'Art. 5', heading: ['Part 2', 'Enforceability'], body: 'A netting agreement is legally enforceable in accordance with its terms against an Insolvent Party and any guarantor or other person providing security for the Insolvent Party, including: (a) the calculation of amounts due to or owed by each party; (b) the termination, liquidation or acceleration of any payment or delivery obligations; (c) the netting of any termination values, payment amounts or delivery values; (d) the application of any margin or collateral.' },
      { locator: 'Art. 8', heading: ['Part 3', 'Stay'], body: 'No stay, moratorium or similar proceeding under any law shall apply to a netting agreement, a Qualified Financial Contract or any related collateral arrangement, to the extent that such a proceeding would prevent or limit the exercise of rights under the netting agreement.' },
    ],
  },
  {
    key: 'qa:civil-code:2004',
    jurisdiction: 'qa',
    sector: null,
    source_type: 'statute',
    title: 'Qatar Civil Code (Law No. 22 of 2004)',
    publisher: 'State of Qatar',
    official_url: 'https://www.almeezan.qa/LawView.aspx?opt&LawID=2559',
    effective_from: '2004-08-30',
    chunks: [
      { locator: 'Art. 64', heading: ['Book 1', 'Formation'], body: 'A contract is formed by the conjunction of an offer made by one of the contracting parties with an acceptance by the other and by their agreement on the essential elements of the contract.' },
      { locator: 'Art. 165', heading: ['Book 2', 'Performance'], body: 'The contract shall be performed in accordance with its content and in a manner consistent with good faith. The contract binds the contracting parties not only to that which it expressly contains, but also to all that, according to law, custom and equity, is deemed a necessary consequence having regard to its nature.' },
      { locator: 'Art. 171', heading: ['Book 2', 'Frustration'], body: 'When, as a result of exceptional and unforeseeable events of a general character, the performance of the contractual obligation becomes excessively onerous in such a way as to threaten the debtor with grievous loss, the judge may, according to the circumstances and after taking into consideration the interests of both parties, reduce to reasonable limits the obligation that has become excessive.' },
      { locator: 'Art. 256', heading: ['Book 2', 'Damages'], body: 'Damages shall be assessed by the court if not fixed by law or by the contract. Damages shall include the loss sustained and the gain of which the creditor has been deprived, provided that this is a natural consequence of the failure to perform the obligation or of delay in such performance.' },
    ],
  },
  {
    key: 'qa:public-tender-law:2015',
    jurisdiction: 'qa',
    sector: 'construction',
    source_type: 'statute',
    title: 'Qatar Law Regulating Tenders and Auctions (Law No. 24 of 2015)',
    publisher: 'State of Qatar',
    official_url: 'https://www.almeezan.qa/LawView.aspx?opt&LawID=7036',
    effective_from: '2016-06-23',
    chunks: [
      { locator: 'Art. 19', heading: ['Chapter 3', 'Public works'], body: 'A contract for public works exceeding the threshold prescribed by the Council of Ministers shall be awarded only through a public tender, save for the cases of exception expressly provided in this Law. The tender documents shall include detailed technical specifications, the bill of quantities, the conditions of execution, the timetable, and the model of the contract to be concluded with the winning bidder.' },
      { locator: 'Art. 32', heading: ['Chapter 4', 'Bonds'], body: 'The successful bidder shall, prior to signing the contract, provide a performance bond equal to ten percent (10%) of the contract value, in the form of a bank guarantee from a bank licensed in the State, valid until the issuance of the final acceptance certificate.' },
      { locator: 'Art. 41', heading: ['Chapter 5', 'Variations'], body: 'The administrative authority may, during execution, increase or decrease the contractor\'s obligations within a limit not exceeding twenty-five percent (25%) of the contract value, against application of the same unit prices stipulated in the contract.' },
    ],
  },
  {
    key: 'qa-qfc:contract-regulations:2005',
    jurisdiction: 'qa-qfc',
    sector: null,
    source_type: 'regulation',
    title: 'QFC Contract Regulations 2005',
    publisher: 'Qatar Financial Centre Regulatory Authority',
    official_url: 'https://www.qfc.qa/en/laws-and-regulations',
    effective_from: '2005-05-01',
    chunks: [
      { locator: 'Art. 12', heading: ['Part 2', 'Formation'], body: 'A contract is concluded by the acceptance of an offer or by conduct of the parties that is sufficient to show agreement. No further requirement (such as consideration) is necessary for a contract to be valid under these Regulations, provided the parties intended to be legally bound.' },
      { locator: 'Art. 47', heading: ['Part 6', 'Termination'], body: 'A party may terminate the contract where the failure of the other party to perform an obligation under the contract amounts to a fundamental non-performance. In determining whether a failure amounts to a fundamental non-performance, regard shall be had to whether the non-performance substantially deprives the aggrieved party of what it was entitled to expect under the contract.' },
    ],
  },
  {
    key: 'sa:civil-transactions-law:2023',
    jurisdiction: 'sa',
    sector: null,
    source_type: 'statute',
    title: 'Saudi Civil Transactions Law (Royal Decree No. M/191 of 1444H / 2023)',
    publisher: 'Kingdom of Saudi Arabia',
    official_url: 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/aac5a9ed-4d3c-4f5f-9a4a-b06200ff7bbe/1',
    effective_from: '2023-12-16',
    chunks: [
      { locator: 'Art. 26', heading: ['Chapter 2', 'Formation'], body: 'A contract is concluded when an offer made by one party is accepted by the other and both expressions of will are joined in the same sitting or, in case of contracts between absent parties, when the offeror becomes aware of the acceptance.' },
      { locator: 'Art. 95', heading: ['Chapter 4', 'Good faith'], body: 'The contract must be performed in accordance with its terms and in a manner consistent with the requirements of good faith. The parties are bound by what is expressly stated in the contract and by what is considered, by law or custom, to be a necessary implication thereof.' },
      { locator: 'Art. 110', heading: ['Chapter 5', 'Hardship'], body: 'If, after the conclusion of the contract, exceptional general circumstances which could not have been foreseen render the performance of the contractual obligation, although not impossible, gravely onerous to the obligor so as to threaten him with grave loss, the court may, having regard to the circumstances and the interests of both parties, reduce the onerous obligation to a reasonable level. Any agreement to the contrary shall be void.' },
      { locator: 'Art. 173', heading: ['Chapter 7', 'Damages'], body: 'If the obligor is in default in performing his obligation or delays performance, he shall be liable to compensate the obligee for the damage caused thereby, unless he proves that the failure was due to a cause beyond his control.' },
    ],
  },
  {
    key: 'sa:companies-law:2022',
    jurisdiction: 'sa',
    sector: 'corporate',
    source_type: 'statute',
    title: 'Saudi Companies Law (Royal Decree No. M/132 of 1443H / 2022)',
    publisher: 'Kingdom of Saudi Arabia',
    official_url: 'https://mc.gov.sa/en/Regulations/Pages/CompaniesLaw.aspx',
    effective_from: '2023-01-19',
    chunks: [
      { locator: 'Art. 27', heading: ['Chapter 3', 'Directors'], body: 'A director shall perform his duties in good faith, with the care of a prudent person, and in the best interests of the company. He shall avoid any conflict of interest and shall not exploit, for personal benefit or for the benefit of others, the assets, information or opportunities of the company that come to his knowledge by virtue of his position.' },
      { locator: 'Art. 167', heading: ['Chapter 7', 'Capital'], body: 'A joint stock company may reduce its capital if it is in excess of the company\'s need or if it has incurred losses. The reduction shall require an extraordinary general assembly resolution, an auditor\'s report, and publication. Creditors may, within thirty days of publication, object to the reduction and demand satisfaction or adequate security.' },
    ],
  },
  {
    key: 'sa:pdpl:2021',
    jurisdiction: 'sa',
    sector: 'data_protection',
    source_type: 'statute',
    title: 'Saudi Personal Data Protection Law (Royal Decree No. M/19 of 1443H, amended 2023)',
    publisher: 'Kingdom of Saudi Arabia',
    official_url: 'https://sdaia.gov.sa/en/SDAIA/about/Files/PersonalDataEnglish.pdf',
    effective_from: '2023-09-14',
    chunks: [
      { locator: 'Art. 4', heading: ['Chapter 1', 'Rights'], body: 'A Data Subject shall have the following rights with respect to his Personal Data: (1) the right to be informed of the legal or actual justification for collecting his Personal Data and the purpose of the collection; (2) the right of access to his Personal Data held by the Controller; (3) the right to request the correction, completion or updating of his Personal Data; (4) the right to request the destruction of his Personal Data when no longer needed.' },
      { locator: 'Art. 20', heading: ['Chapter 4', 'Breach'], body: 'The Controller shall, upon becoming aware of any Personal Data Breach, leakage or unlawful access to such data which may cause damage to the Personal Data, the Data Subject or conflict with his rights or interests, notify the Competent Authority within seventy-two (72) hours of becoming aware of the incident, and shall notify the Data Subject without undue delay where the breach is likely to result in a high risk to him.' },
    ],
  },
  {
    key: 'bh:pdpl:2018',
    jurisdiction: 'bh',
    sector: 'data_protection',
    source_type: 'statute',
    title: 'Bahrain Personal Data Protection Law (Law No. 30 of 2018)',
    publisher: 'Kingdom of Bahrain',
    official_url: 'https://www.legalaffairs.gov.bh/LegislationSearchDetails.aspx?id=23914',
    effective_from: '2019-08-01',
    chunks: [
      { locator: 'Art. 4', heading: ['Chapter 2', 'Principles'], body: 'The processing of Personal Data shall be carried out lawfully and fairly. Personal Data shall be collected for specified, explicit and legitimate purposes, and shall not be further processed in a manner incompatible with those purposes. Personal Data shall be adequate, relevant and not excessive in relation to the purposes for which they are collected and further processed.' },
      { locator: 'Art. 13', heading: ['Chapter 3', 'Rights'], body: 'The Data Subject shall have the right to obtain from the Data Manager confirmation as to whether or not Personal Data concerning him are being processed, and, where that is the case, access to the Personal Data, the purposes of the processing, the categories of recipients to whom the data have been or will be disclosed, and the envisaged period for which the Personal Data will be stored.' },
    ],
  },
  // ─── Oil & gas vertical (international model contracts + UAE federal) ──────
  {
    key: 'intl:aipn-joa:2012',
    jurisdiction: 'intl',
    sector: 'oil_gas',
    source_type: 'model_contract',
    title: 'AIPN Model International Joint Operating Agreement (2012)',
    publisher: 'Association of International Petroleum Negotiators',
    official_url: 'https://www.aipn.org/model-contracts/joa',
    effective_from: '2012-01-01',
    chunks: [
      { locator: 'Art. 4.2', heading: ['Article 4', 'Operator'], body: 'The Operator shall conduct all Joint Operations in accordance with the provisions of this Agreement, the Contract and all applicable Laws and Regulations. The Operator shall in the conduct of Joint Operations: (a) perform the Joint Operations in a good and workmanlike manner, in accordance with Good Oilfield Practices; (b) ensure that the Joint Operations are conducted with due diligence; (c) be responsible to the Non-Operators for the proper and correct conduct of Joint Operations.' },
      { locator: 'Art. 4.6', heading: ['Article 4', 'Operator — Standard of Care'], body: 'The Operator shall not be liable to the Non-Operators for any loss or damage suffered by them in connection with the Joint Operations, unless such loss or damage is the result of the Gross Negligence or Wilful Misconduct of the Operator. In no event shall the Operator be liable for Consequential Loss.' },
      { locator: 'Art. 5.9', heading: ['Article 5', 'Operating Committee'], body: 'Except as otherwise provided in this Agreement, all decisions, approvals and other actions of the Operating Committee shall be decided by the affirmative vote of two (2) or more Parties holding collectively at least sixty-five percent (65%) of the Participating Interests. Each Party shall have a voting interest equal to its Participating Interest.' },
      { locator: 'Art. 7.2', heading: ['Article 7', 'Work Programs and Budgets'], body: 'During the Exploration Period and any subsequent period, the Operator shall prepare and submit to the Operating Committee a proposed Work Program and Budget for the calendar year. The Operating Committee shall meet to consider and approve such proposed Work Program and Budget no later than thirty (30) days following its submission.' },
      { locator: 'Art. 8.4', heading: ['Article 8', 'Operations by Less than All Parties'], body: 'If a Party (the Non-Consenting Party) elects not to participate in a proposed Exclusive Operation, the Consenting Parties shall conduct such Exclusive Operation at their sole cost, risk and expense. The Non-Consenting Party shall not be entitled to share in the production, revenues or benefits arising from the Exclusive Operation until full recovery of the Exclusive Operation costs, plus the applicable risk premium (typically 300%-500% of Non-Consenting Party\'s share).' },
      { locator: 'Art. 9.2', heading: ['Article 9', 'Default'], body: 'If a Party (the Defaulting Party) fails to pay any amount due under this Agreement when the same is due, that Party shall be in default. Following the expiry of any cure period, the Non-Defaulting Parties may exercise remedies including suspension of the Defaulting Party\'s rights, forfeiture of its Participating Interest, and seeking direct enforcement under applicable Law.' },
    ],
  },
  {
    key: 'intl:aipn-confidentiality:2015',
    jurisdiction: 'intl',
    sector: 'oil_gas',
    source_type: 'model_contract',
    title: 'AIPN Model International Confidentiality Agreement (2015)',
    publisher: 'Association of International Petroleum Negotiators',
    official_url: 'https://www.aipn.org/model-contracts/confidentiality',
    effective_from: '2015-01-01',
    chunks: [
      { locator: 'Art. 2', heading: ['Confidential Information'], body: 'For the purposes of this Agreement, "Confidential Information" means all information, in whatever form, relating to the Disclosing Party and/or the Project, which is disclosed by the Disclosing Party to the Receiving Party, including but not limited to: technical data, geophysical and geological information, reservoir data, drilling records, production data, commercial terms, and any analyses, compilations or reports prepared by the Receiving Party that contain or reflect such information.' },
      { locator: 'Art. 5', heading: ['Permitted Disclosures'], body: 'The Receiving Party may disclose Confidential Information without the prior written consent of the Disclosing Party only: (a) to its Affiliates and to its and their employees, directors, officers, consultants and professional advisers who have a bona fide need to know such information for the Permitted Purpose and who are bound by obligations of confidentiality no less protective than those set out herein; (b) to any Governmental Authority where required by Law; (c) to bona fide prospective assignees or financing parties subject to a written confidentiality undertaking.' },
      { locator: 'Art. 8', heading: ['Duration'], body: 'The obligations of confidentiality set out in this Agreement shall continue in effect for a period of [three (3) / five (5)] years from the date of this Agreement, save that obligations relating to information disclosed pursuant to a subsequent definitive agreement shall be governed by the terms of that agreement.' },
    ],
  },
  {
    key: 'intl:aipn-farmout:2014',
    jurisdiction: 'intl',
    sector: 'oil_gas',
    source_type: 'model_contract',
    title: 'AIPN Model International Farmout Agreement (2014)',
    publisher: 'Association of International Petroleum Negotiators',
    official_url: 'https://www.aipn.org/model-contracts/farmout',
    effective_from: '2014-01-01',
    chunks: [
      { locator: 'Art. 3.1', heading: ['Article 3', 'Earn-In'], body: 'In consideration of the assignment of the Farmout Interest, the Farmee shall pay all costs of the Earn-In Wells up to an aggregate amount of [Earn-In Cap], and shall carry the Farmor\'s share of such costs. Upon completion of the Earn-In Obligations to the reasonable satisfaction of the Farmor, the Farmor shall transfer the Farmout Interest to the Farmee, free of all encumbrances except those of the Underlying Agreement.' },
      { locator: 'Art. 6', heading: ['Article 6', 'Conditions Precedent'], body: 'The obligation of the Farmor to assign the Farmout Interest shall be subject to the satisfaction or waiver of the following conditions precedent: (a) obtaining all necessary governmental approvals; (b) compliance with any pre-emption rights of other parties to the Underlying Agreement; (c) absence of any material adverse change in the Farmout Interest between signing and closing; (d) payment in full of the Earn-In costs by the Farmee.' },
      { locator: 'Art. 9', heading: ['Article 9', 'Default'], body: 'If the Farmee fails to fulfil its Earn-In Obligations by the Earn-In Deadline, the Farmor may, at its sole discretion, (a) extend the deadline subject to additional consideration; (b) terminate this Agreement and retain the Farmout Interest; or (c) require the Farmee to pay the full unfulfilled portion of the Earn-In costs in cash. The Farmee shall in any event remain liable for its proportionate share of any abandonment liabilities accrued during the Earn-In period.' },
    ],
  },
  {
    key: 'intl:fidic-red-book:2017',
    jurisdiction: 'intl',
    sector: 'construction',
    source_type: 'model_contract',
    title: 'FIDIC Conditions of Contract for Construction (Red Book, 2017 Edition)',
    publisher: 'Fédération Internationale des Ingénieurs-Conseils (FIDIC)',
    official_url: 'https://fidic.org/bookshop/conditions-contract-construction',
    effective_from: '2017-12-05',
    chunks: [
      { locator: 'Sub-Clause 4.1', heading: ['Clause 4', 'The Contractor'], body: 'The Contractor shall design (to the extent specified in the Contract), execute and complete the Works in accordance with the Contract, and shall remedy any defects in the Works. When completed, the Works shall be fit for the purposes for which they are intended, as defined in the Contract. The Contractor shall provide the Plant and Contractor\'s Documents specified in the Contract, and all Contractor\'s Personnel, Goods, consumables and other things and services, whether of a temporary or permanent nature, required in and for this design, execution, completion and remedying of defects.' },
      { locator: 'Sub-Clause 8.5', heading: ['Clause 8', 'Commencement, Delays and Suspension'], body: 'The Contractor shall be entitled to an extension of the Time for Completion if and to the extent that completion is or will be delayed by any of the following causes: (a) a Variation; (b) a cause of delay giving an entitlement under a Sub-Clause of these Conditions; (c) exceptionally adverse climatic conditions; (d) Unforeseeable shortages in the availability of personnel or Goods caused by epidemic or governmental actions; (e) any delay, impediment or prevention caused by or attributable to the Employer, the Employer\'s Personnel, or the Employer\'s other contractors.' },
      { locator: 'Sub-Clause 17.4', heading: ['Clause 17', 'Care of the Works and Indemnities'], body: 'Neither Party shall be liable to the other Party for loss of use of any Works, loss of profit, loss of any contract or for any indirect or consequential loss or damage which may be suffered by the other Party in connection with the Contract, other than under Sub-Clause 8.8 [Delay Damages], Sub-Clause 13.3.1 [Variation by Instruction], Sub-Clause 15.7 [Payment after Termination for Employer\'s Convenience], Sub-Clause 16.4 [Payment after Termination by Contractor] and Sub-Clause 17.1 [Responsibility for Care of the Works].' },
      { locator: 'Sub-Clause 21.4', heading: ['Clause 21', 'Disputes and Arbitration'], body: 'Unless settled amicably, any dispute in respect of which the DAAB\'s decision (if any) has not become final and binding shall be finally settled by international arbitration. Unless otherwise agreed by both Parties: (a) the dispute shall be finally settled under the Rules of Arbitration of the International Chamber of Commerce; (b) the dispute shall be settled by three arbitrators appointed in accordance with these Rules; and (c) the arbitration shall be conducted in the ruling language defined in Sub-Clause 1.4.' },
    ],
  },
  {
    key: 'ae:petroleum-resources-law:2017',
    jurisdiction: 'ae',
    sector: 'oil_gas',
    source_type: 'statute',
    title: 'UAE Federal Decree-Law No. 14 of 2017 on Petroleum Resources',
    publisher: 'United Arab Emirates',
    official_url: 'https://uaelegislation.gov.ae/en/legislations/1057/download',
    effective_from: '2017-12-31',
    chunks: [
      { locator: 'Art. 3', heading: ['Chapter 1', 'General Provisions'], body: 'Petroleum Resources existing within the territory of the State, including its territorial waters, continental shelf and exclusive economic zone, are the public property of the Emirate in which they are located, and shall not be granted to any natural or legal person except in accordance with this Decree-Law and the Concession Agreement.' },
      { locator: 'Art. 6', heading: ['Chapter 2', 'Concessions'], body: 'No person may carry out Petroleum Operations within the State except pursuant to a Concession granted in accordance with this Decree-Law. The Concession Agreement shall specify: the work program, the minimum financial commitments, the duration of the exploration and exploitation phases, the State\'s participating interest, royalty rates, profit petroleum sharing mechanism, and decommissioning obligations.' },
      { locator: 'Art. 14', heading: ['Chapter 4', 'Operations'], body: 'The Concessionaire shall conduct all Petroleum Operations in accordance with Good International Petroleum Industry Practices, shall comply with all applicable health, safety and environmental laws and regulations, and shall be liable for any damage caused to public or private property, persons or the environment arising from its Petroleum Operations, save where caused by the wilful act of a third party.' },
    ],
  },
  {
    key: 'ae-difc:operating-law:2018',
    jurisdiction: 'ae-difc',
    sector: 'commercial',
    source_type: 'statute',
    title: 'DIFC Operating Law (DIFC Law No. 7 of 2018)',
    publisher: 'Dubai International Financial Centre',
    official_url: 'https://www.difc.ae/business/laws-and-regulations/legal-database/operating-law-difc-law-no-7-2018',
    effective_from: '2018-11-12',
    chunks: [
      { locator: 'Art. 17', heading: ['Part 3', 'Conduct'], body: 'A Person carrying on a Business in the DIFC must do so in a manner which: maintains the reputation of the DIFC; complies with all applicable DIFC Laws and Regulations; observes high standards of integrity and fair dealing; and treats employees, counterparties and customers with due care and skill.' },
      { locator: 'Art. 25', heading: ['Part 4', 'Records'], body: 'A Person carrying on a Business in the DIFC shall keep and maintain, for a period of at least six years, records sufficient to: demonstrate compliance with this Law and any other applicable DIFC Law; allow the activities of the Person to be reconstructed; and enable any contravention to be identified.' },
    ],
  },
];

function approxTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function main() {
  const admin = createAdminClient();
  let totalChunks = 0;

  for (const src of SOURCES) {
    const { data: existing } = await admin
      .from('legal_sources')
      .select('id')
      .eq('key', src.key)
      .maybeSingle();

    let sourceId: string;
    if (existing) {
      sourceId = existing.id;
      await admin.from('legal_chunks').delete().eq('source_id', sourceId);
      console.log(`  re-using source ${src.key} (cleared chunks)`);
    } else {
      const { data: inserted, error } = await admin
        .from('legal_sources')
        .insert({
          key: src.key,
          jurisdiction: src.jurisdiction,
          sector: src.sector,
          source_type: src.source_type,
          title: src.title,
          publisher: src.publisher,
          official_url: src.official_url,
          effective_from: src.effective_from,
          license_class: 'public',
          ingested_at: new Date().toISOString(),
          metadata: {
            seeded: true,
            verbatim_pending: true,
            note: 'demo paraphrase — run fetch-official-sources.ts to replace with verbatim PDF text',
          },
        })
        .select('id')
        .single();
      if (error || !inserted) throw error ?? new Error(`failed to insert source ${src.key}`);
      sourceId = inserted.id;
      console.log(`+ source ${src.key}`);
    }

    const chunkRows = src.chunks.map((c, i) => ({
      source_id: sourceId,
      ordinal: i,
      heading_path: c.heading,
      locator: c.locator,
      body: c.body,
      token_count: approxTokens(c.body),
      language: 'en',
    }));
    const { error: chunkErr } = await admin.from('legal_chunks').insert(chunkRows);
    if (chunkErr) throw chunkErr;
    totalChunks += chunkRows.length;
    console.log(`  + ${chunkRows.length} chunks`);
  }

  console.log(`\nDone. ${SOURCES.length} sources, ${totalChunks} chunks.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
