// Copyright (c) 2018, libracore and contributors
// For license information, please see license.txt

frappe.ui.form.on('AT VAT Declaration', {
	refresh: function(frm) {
        frm.add_custom_button(__("Get values"), function() 
		{
			get_values(frm);
		});
        frm.add_custom_button(__("Recalculate"), function() 
		{
			recalculate(frm);
		});
        
        recalculate(frm);

        if (frm.doc.__islocal) {
            // this function is called when a new VAT declaration is created
            // get current month (0..11)
            var d = new Date();
            var n = d.getMonth();
            // define title as Qn YYYY of the last complete quarter
            var title = " / " + d.getFullYear();
            if ((n > (-1)) && (n < 3)) {
                title = "Q04 / " + (d.getFullYear() - 1);
                frm.set_value('start_date', (d.getFullYear() - 1) + "-10-01");
                frm.set_value('end_date', (d.getFullYear() - 1) + "-12-31");
            } else if ((n > (2)) && (n < 6)) {
                title = "Q01" + title;
                frm.set_value('start_date', d.getFullYear() + "-01-01");
                frm.set_value('end_date', d.getFullYear() + "-03-31");
            } else if ((n > (5)) && (n < 9)) {
                title = "Q02" + title;
                frm.set_value('start_date', d.getFullYear() + "-04-01");
                frm.set_value('end_date', d.getFullYear() + "-06-30");
            } else {
                title = "Q03" + title;
                frm.set_value('start_date', d.getFullYear() + "-07-01");
                frm.set_value('end_date', d.getFullYear() + "-09-30");
            } 

            frm.set_value('title', title);
        }
    }
});

// force recalculate
function recalculate(frm) {
    update_taxable_revenue(frm);
    update_tax_amounts(frm);
    update_payable_tax(frm);
}

// retrieve values from database
function get_values(frm) {
    // Total revenue
    get_total(frm, "viewVAT_200", 'total_revenue');
    // get_total(frm, "viewVAT_205", 'non_taxable_revenue');
    // Deductions
    //get_total(frm, "viewVAT_220", 'tax_free_services');
    //get_total(frm, "viewVAT_221", 'revenue_abroad');
    //get_total(frm, "viewVAT_225", 'transfers');
    //get_total(frm, "viewVAT_230", 'non_taxable_services');
    //get_total(frm, "viewVAT_235", 'losses');
    // Tax calculation
    //get_total(frm, "viewVAT_321", 'amount_1');
    //get_total(frm, "viewVAT_331", 'amount_2');

    //get_total(frm, "viewVAT_381", 'additional_amount');
    // Pretaxes
    //get_tax(frm, "viewVAT_400", 'pretax_material');
    //get_tax(frm, "viewVAT_405", 'pretax_investments');
}

// add change handlers for tax positions
//frappe.ui.form.on("AT VAT Declaration", "normal_amount", function(frm) { update_tax_amounts(frm) } );

// add change handlers for deduction positions
//frappe.ui.form.on("AT VAT Declaration", "tax_free_services", function(frm) { update_taxable_revenue(frm) } );

// add change handlers for pretax
//frappe.ui.form.on("AT VAT Declaration", "pretax_material", function(frm) { update_payable_tax(frm) } );

// Recalculate tax amount based on inputs
function update_tax_amounts(frm) {
    normal_tax = frm.doc.normal_amount * (frm.doc.normal_rate / 100);
    reduced_tax = frm.doc.reduced_amount * (frm.doc.reduced_rate / 100);
    lodging_tax = frm.doc.lodging_amount * (frm.doc.lodging_rate / 100);
    tax_1 = frm.doc.amount_1 * (frm.doc.rate_1 / 100);
    tax_2 = frm.doc.amount_2 * (frm.doc.rate_2 / 100);
    total_tax = normal_tax + reduced_tax + lodging_tax + tax_1 + tax_2 + frm.doc.additional_tax;
    frm.set_value('normal_tax', normal_tax);
    frm.set_value('reduced_tax', reduced_tax);
    frm.set_value('lodging_tax', lodging_tax);
    frm.set_value('tax_1', tax_1);
    frm.set_value('tax_2', tax_2);
    frm.set_value('total_tax', total_tax);
}

// update deduction section
function update_taxable_revenue(frm) {
    var deductions =  frm.doc.tax_free_services +
        frm.doc.revenue_abroad +
        frm.doc.transfers + 
        frm.doc.non_taxable_services + 
        frm.doc.losses +
        frm.doc.misc;
    var taxable = frm.doc.total_revenue - frm.doc.non_taxable_revenue - deductions;
    frm.set_value('total_deductions', deductions);
    frm.set_value('taxable_revenue', taxable);
}

// update payable tax section        
function update_payable_tax(frm) {
    var pretax = frm.doc.pretax_material 
        + frm.doc.pretax_investments 
        + frm.doc.missing_pretax 
        - frm.doc.pretax_correction_mixed
        - frm.doc.pretax_correction_other
        + frm.doc.form_1050
        + frm.doc.form_1055;
    frm.set_value('total_pretax_reductions', pretax);
    var payable_tax = frm.doc.total_tax - pretax;
    frm.set_value('payable_tax', payable_tax);
}

/* view: view to use
 * target: target field
 */
function get_total(frm, view, target) {
    // total revenues is the sum of all base grnad totals in the period
    frappe.call({
        method: 'erpnextaustria.erpnextaustria.doctype.at_vat_declaration.at_vat_declaration.get_view_total',
        args: { 
            start_date: frm.doc.start_date,
            end_date: frm.doc.end_date,
            view_name: view
        },
        callback: function(r) {
            if (r.message) {
                frm.set_value(target, r.message.total);
            }
        }
    }); 
}

/* view: view to use
 * target: target field
 */
function get_tax(frm, view, target) {
    // total tax is the sum of all taxes in the period
    frappe.call({
        method: 'erpnextaustria.erpnextaustria.doctype.at_vat_declaration.at_vat_declaration.get_view_tax',
        args: { 
            start_date: frm.doc.start_date,
            end_date: frm.doc.end_date,
            view_name: view
        },
        callback: function(r) {
            if (r.message) {
                frm.set_value(target, r.message.total);
            }
        }
    }); 
}
