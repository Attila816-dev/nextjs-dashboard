'use server';
 
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { expirePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
  });

const CreateInvoice = FormSchema.omit({ id: true, date: true });

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {  
  const rawFormData = Object.fromEntries(formData.entries());
  // Test it out:
  console.log(rawFormData);

  const { customerId, amount, status } = CreateInvoice.parse(rawFormData);
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
  
  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
 
  expirePath('/dashboard/invoices');  
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
    const rawFormData = Object.fromEntries(formData.entries());
    console.log(rawFormData);

    const { customerId, amount, status } = UpdateInvoice.parse(rawFormData);
   
    const amountInCents = amount * 100;
   
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
   
    expirePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  }

  export async function deleteInvoice(id: string) {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    expirePath('/dashboard/invoices');
  }